from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
import math
from validate_pose import evaluate_pose, POSE_DISPATCH

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Database path
DB_PATH = 'ptpal_data.db'

def init_database():
    """Initialize the SQLite database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create pose data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pose_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            landmarks TEXT NOT NULL,
            world_landmarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create angle calculations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS angle_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            shoulder_left REAL,
            shoulder_right REAL,
            elbow_left REAL,
            elbow_right REAL,
            hip_left REAL,
            hip_right REAL,
            knee_left REAL,
            knee_right REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # No feedback table needed - just storing angles for external analysis
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

def calculate_angle(p1, p2, p3):
    """
    Calculate angle between t2ee points
    p1: center point, p2: first point, p3: second point
    Returns angle in degrees
    """
    # Convert to numpy arrays if needed
    try:
        v1 = [p2['x'] - p1['x'], p2['y'] - p1['y']]
        v2 = [p3['x'] - p1['x'], p3['y'] - p1['y']]
        
        dot_product = v1[0] * v2[0] + v1[1] * v2[1]
        magnitude1 = math.sqrt(v1[0]**2 + v1[1]**2)
        magnitude2 = math.sqrt(v2[0]**2 + v2[1]**2)
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0
            
        cos_angle = dot_product / (magnitude1 * magnitude2)
        cos_angle = max(-1, min(1, cos_angle))  # Clamp to avoid floating point errors
        angle_rad = math.acos(cos_angle)
        angle_deg = math.degrees(angle_rad)
        
        return angle_deg
    except Exception as e:
        print(f"Angle calculation error: {e}")
        return 0

def process_pose_data(landmarks):
    """
    Extract joint angles from pose landmarks
    Returns dictionary with calculated angles
    """
    if not landmarks or len(landmarks) < 33:
        return {}
    
    # MediaPipe BlazePose landmark indices
    # Key joints for physical therapy analysis
    try:
        angles = {}
        
        # Shoulder angles (left and right)
        # left shoulder = 11, left elbow = 13, left wrist = 15
        if len(landmarks) > 15:
            angles['shoulder_left'] = calculate_angle(
                landmarks[11], landmarks[13], landmarks[15]
            )
        
        # right shoulder = 12, right elbow = 14, right wrist = 16  
        if len(landmarks) > 16:
            angles['shoulder_right'] = calculate_angle(
                landmarks[12], landmarks[14], landmarks[16]
            )
            
        # Elbow angles (left and right)
        if len(landmarks) > 15:
            angles['elbow_left'] = calculate_angle(
                landmarks[13], landmarks[11], landmarks[15]
            )
        if len(landmarks) > 16:
            angles['elbow_right'] = calculate_angle(
                landmarks[14], landmarks[12], landmarks[16]
            )
            
        # Hip angles 
        # left hip = 23, left knee = 25, left ankle = 27
        if len(landmarks) > 27:
            angles['hip_left'] = calculate_angle(
                landmarks[23], landmarks[25], landmarks[27]
            )
            
        # right hip = 24, right knee = 26, right ankle = 28
        if len(landmarks) > 28:
            angles['hip_right'] = calculate_angle(
                landmarks[24], landmarks[26], landmarks[28]
            )
            
        # Knee angles
        if len(landmarks) > 27:
            angles['knee_left'] = calculate_angle(
                landmarks[25], landmarks[23], landmarks[27]
            )
        if len(landmarks) > 28:
            angles['knee_right'] = calculate_angle(
                landmarks[26], landmarks[24], landmarks[28]
            )
        
        return angles
    except Exception as e:
        print(f"Error processing pose data: {e}")
        return {}

def save_angle_data(session_id, timestamp, angles):
    """Save calculated angles to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO angle_data (session_id, timestamp, shoulder_left, shoulder_right,
                               elbow_left, elbow_right, hip_left, hip_right,
                               knee_left, knee_right)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        session_id, timestamp,
        angles.get('shoulder_left', 0),
        angles.get('shoulder_right', 0), 
        angles.get('elbow_left', 0),
        angles.get('elbow_right', 0),
        angles.get('hip_left', 0),
        angles.get('hip_right', 0),
        angles.get('knee_left', 0),
        angles.get('knee_right', 0)
    ))
    
    conn.commit()
    conn.close()

@app.route('/api/pose-data', methods=['POST'])
def receive_pose_data():
    """Receive pose data from frontend and process it"""
    try:
        data = request.get_json()
        session_id = data.get('sessionId')
        timestamp = data.get('timestamp')
        landmarks = data.get('landmarks')
        world_landmarks = data.get('worldLandmarks')
        
        # Save raw pose data
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO pose_data (session_id, timestamp, landmarks, world_landmarks)
            VALUES (?, ?, ?, ?)
        ''', (
            session_id, timestamp, 
            json.dumps(landmarks),
            json.dumps(world_landmarks) if world_landmarks else None
        ))
        
        conn.commit()
        conn.close()
        
        # Process angles
        angles = process_pose_data(landmarks)
        if angles:
            save_angle_data(session_id, timestamp, angles)
            
        print(f"Processed data for session: {session_id}")
        return jsonify({"status": "success", "angles": angles})
        
    except Exception as e:
        print(f"Error processing pose data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

def compute_pose_metrics(pose_type, landmarks):
    """
    Compute all required metrics for a specific pose type from landmarks.
    Returns a dictionary of metrics needed for validation.
    """
    if not landmarks or len(landmarks) < 33:
        return {}
    
    metrics = {}
    
    try:
        # Landmark indices
        LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
        LEFT_HIP, RIGHT_HIP = 23, 24
        LEFT_KNEE, RIGHT_KNEE = 25, 26
        LEFT_ANKLE, RIGHT_ANKLE = 27, 28
        LEFT_HEEL, RIGHT_HEEL = 29, 30
        LEFT_TOE, RIGHT_TOE = 31, 32
        LEFT_WRIST, RIGHT_WRIST = 15, 16
        
        # === Common calculations ===
        
        # Knee flexion angle (hip-knee-ankle)
        knee_left_angle = calculate_angle(landmarks[LEFT_KNEE], landmarks[LEFT_HIP], landmarks[LEFT_ANKLE])
        knee_right_angle = calculate_angle(landmarks[RIGHT_KNEE], landmarks[RIGHT_HIP], landmarks[RIGHT_ANKLE])
        metrics['knee_flexion_deg'] = (knee_left_angle + knee_right_angle) / 2
        metrics['knee_flexion_left_deg'] = knee_left_angle
        metrics['knee_flexion_right_deg'] = knee_right_angle
        
        # Hip-knee-ankle alignment (frontal plane - knee valgus/varus)
        # Measure horizontal deviation of knee from hip-ankle line
        left_knee_x_deviation = abs(landmarks[LEFT_KNEE]['x'] - landmarks[LEFT_HIP]['x']) * 100
        right_knee_x_deviation = abs(landmarks[RIGHT_KNEE]['x'] - landmarks[RIGHT_HIP]['x']) * 100
        metrics['hip_knee_ankle_alignment_deg'] = (left_knee_x_deviation + right_knee_x_deviation) / 2
        
        # Heel height (vertical distance from toe to heel)
        left_heel_height = abs(landmarks[LEFT_HEEL]['y'] - landmarks[LEFT_TOE]['y']) * 170  # Approx cm
        right_heel_height = abs(landmarks[RIGHT_HEEL]['y'] - landmarks[RIGHT_TOE]['y']) * 170
        metrics['heel_height_cm'] = (left_heel_height + right_heel_height) / 2
        
        # Trunk forward lean (angle from vertical)
        mid_shoulder_x = (landmarks[LEFT_SHOULDER]['x'] + landmarks[RIGHT_SHOULDER]['x']) / 2
        mid_shoulder_y = (landmarks[LEFT_SHOULDER]['y'] + landmarks[RIGHT_SHOULDER]['y']) / 2
        mid_hip_x = (landmarks[LEFT_HIP]['x'] + landmarks[RIGHT_HIP]['x']) / 2
        mid_hip_y = (landmarks[LEFT_HIP]['y'] + landmarks[RIGHT_HIP]['y']) / 2
        
        trunk_lean_rad = math.atan2(abs(mid_shoulder_x - mid_hip_x), abs(mid_shoulder_y - mid_hip_y))
        metrics['trunk_forward_lean_deg'] = math.degrees(trunk_lean_rad)
        
        # Bilateral symmetry
        if metrics['knee_flexion_left_deg'] > 0 or metrics['knee_flexion_right_deg'] > 0:
            max_knee = max(metrics['knee_flexion_left_deg'], metrics['knee_flexion_right_deg'])
            if max_knee > 0:
                metrics['symmetry_diff_pct'] = abs(metrics['knee_flexion_left_deg'] - metrics['knee_flexion_right_deg']) / max_knee * 100
            else:
                metrics['symmetry_diff_pct'] = 0
        else:
            metrics['symmetry_diff_pct'] = 0
        
        # Pelvic drop/obliquity (hip height difference)
        hip_height_diff = abs(landmarks[LEFT_HIP]['y'] - landmarks[RIGHT_HIP]['y'])
        metrics['pelvic_drop_deg'] = hip_height_diff * 100  # Convert to approximate degrees
        
        # Ankle roll (simplified - would need 3D for accurate measurement)
        metrics['ankle_roll_deg'] = 0  # Placeholder - needs world landmarks
        
        # === Pose-specific calculations ===
        
        if pose_type == 'partial_squat':
            # Already have: knee_flexion_deg, hip_knee_ankle_alignment_deg, heel_height_cm, trunk_forward_lean_deg
            pass
        
        elif pose_type == 'heel_raises':
            # Already have: heel_height_cm, symmetry_diff_pct, ankle_roll_deg, trunk_forward_lean_deg
            pass
        
        elif pose_type in ['single_leg_stance', 'tree_pose', 'tree_pose_left', 'tree_pose_right']:
            # Calculate sway as hip-shoulder alignment (horizontal deviation)
            # Mid-shoulder and mid-hip x-coordinates
            mid_shoulder_x_sway = (landmarks[LEFT_SHOULDER]['x'] + landmarks[RIGHT_SHOULDER]['x']) / 2
            mid_hip_x_sway = (landmarks[LEFT_HIP]['x'] + landmarks[RIGHT_HIP]['x']) / 2
            
            # Calculate horizontal deviation as an angle approximation
            # Using the vertical distance between shoulders and hips as reference
            mid_shoulder_y_sway = (landmarks[LEFT_SHOULDER]['y'] + landmarks[RIGHT_SHOULDER]['y']) / 2
            mid_hip_y_sway = (landmarks[LEFT_HIP]['y'] + landmarks[RIGHT_HIP]['y']) / 2
            vertical_dist = abs(mid_shoulder_y_sway - mid_hip_y_sway)
            horizontal_dist = abs(mid_shoulder_x_sway - mid_hip_x_sway)
            
            if vertical_dist > 0:
                # Calculate angle in degrees (arctan of horizontal/vertical deviation)
                sway_angle_rad = math.atan2(horizontal_dist, vertical_dist)
                metrics['sway_peak_deg'] = math.degrees(sway_angle_rad)
            else:
                metrics['sway_peak_deg'] = 0
            
            # Arm overhead alignment (for tree pose)
            if landmarks[LEFT_WRIST]['y'] < landmarks[LEFT_SHOULDER]['y'] and landmarks[RIGHT_WRIST]['y'] < landmarks[RIGHT_SHOULDER]['y']:
                wrist_height_diff = abs(landmarks[LEFT_WRIST]['y'] - landmarks[RIGHT_WRIST]['y'])
                metrics['arm_overhead_alignment_deg'] = wrist_height_diff * 100
            else:
                metrics['arm_overhead_alignment_deg'] = 20  # Arms not raised
            
            # Leg lift detection (for tree pose)
            # Check if one ankle is lifted significantly higher than the other
            left_ankle_y = landmarks[LEFT_ANKLE]['y']
            right_ankle_y = landmarks[RIGHT_ANKLE]['y']
            ankle_height_diff = abs(left_ankle_y - right_ankle_y)
            
            # Convert to approximate cm (lower y = higher on screen = lifted)
            # If one ankle is higher (lower y value), that leg is lifted
            metrics['leg_lift_height_cm'] = ankle_height_diff * 170  # Approx conversion to cm
            
            # Determine which leg is lifted (for specific left/right tree pose validation)
            # Lower y value = higher on screen = lifted leg
            if left_ankle_y < right_ankle_y:
                # Left leg is lifted (standing on right leg)
                metrics['lifted_leg'] = 'left'
                metrics['standing_leg'] = 'right'
            else:
                # Right leg is lifted (standing on left leg)
                metrics['lifted_leg'] = 'right'
                metrics['standing_leg'] = 'left'
        
        elif pose_type == 'tandem_stance':
            # Store all four x coordinates for visualization
            left_heel_x = landmarks[LEFT_HEEL]['x']
            left_toe_x = landmarks[LEFT_TOE]['x']
            right_heel_x = landmarks[RIGHT_HEEL]['x']
            right_toe_x = landmarks[RIGHT_TOE]['x']
            
            metrics['left_heel_x'] = left_heel_x
            metrics['left_toe_x'] = left_toe_x
            metrics['right_heel_x'] = right_heel_x
            metrics['right_toe_x'] = right_toe_x
            
            # Find the rightmost point among all four
            foot_points = {
                'left_toe': left_toe_x,
                'left_heel': left_heel_x,
                'right_toe': right_toe_x,
                'right_heel': right_heel_x
            }
            rightmost_point = max(foot_points, key=foot_points.get)
            metrics['rightmost_point'] = rightmost_point
            
            # Determine which points to measure based on rightmost point
            if rightmost_point == 'left_toe':
                # Left foot is in front, measure left heel to right toe
                point1_x = left_heel_x
                point1_y = landmarks[LEFT_HEEL]['y']
                point2_x = right_toe_x
                point2_y = landmarks[RIGHT_TOE]['y']
                metrics['measured_points'] = 'left_heel to right_toe'
            elif rightmost_point == 'right_toe':
                # Right foot is in front, measure right heel to left toe
                point1_x = right_heel_x
                point1_y = landmarks[RIGHT_HEEL]['y']
                point2_x = left_toe_x
                point2_y = landmarks[LEFT_TOE]['y']
                metrics['measured_points'] = 'right_heel to left_toe'
            elif rightmost_point == 'left_heel':
                # Left foot is in front (heel forward), measure left toe to right heel
                point1_x = left_toe_x
                point1_y = landmarks[LEFT_TOE]['y']
                point2_x = right_heel_x
                point2_y = landmarks[RIGHT_HEEL]['y']
                metrics['measured_points'] = 'left_toe to right_heel'
            else:  # right_heel
                # Right foot is in front (heel forward), measure right toe to left heel
                point1_x = right_toe_x
                point1_y = landmarks[RIGHT_TOE]['y']
                point2_x = left_heel_x
                point2_y = landmarks[LEFT_HEEL]['y']
                metrics['measured_points'] = 'right_toe to left_heel'
            
            # Calculate foot line deviation
            horizontal_dist = abs(point1_x - point2_x)
            vertical_dist = abs(point1_y - point2_y)
            foot_distance = math.sqrt(horizontal_dist**2 + vertical_dist**2)
            metrics['foot_line_deviation_cm'] = foot_distance * 170  # Convert to cm
            
            # Head-to-feet alignment (nose to midpoint of feet)
            mid_foot_x = (landmarks[LEFT_ANKLE]['x'] + landmarks[RIGHT_ANKLE]['x']) / 2
            mid_foot_y = (landmarks[LEFT_ANKLE]['y'] + landmarks[RIGHT_ANKLE]['y']) / 2
            nose_x = landmarks[0]['x']
            nose_y = landmarks[0]['y']
            horizontal_deviation = abs(nose_x - mid_foot_x)
            vertical_dist = abs(nose_y - mid_foot_y)
            
            if vertical_dist > 0:
                head_feet_angle_rad = math.atan2(horizontal_deviation, vertical_dist)
                metrics['head_feet_alignment_deg'] = math.degrees(head_feet_angle_rad)
            else:
                metrics['head_feet_alignment_deg'] = 0
        
        elif pose_type == 'functional_reach':
            # Reach distance ratio (forward reach distance / arm length)
            # Estimate arm length
            arm_length = math.sqrt(
                (landmarks[LEFT_SHOULDER]['x'] - landmarks[LEFT_WRIST]['x'])**2 +
                (landmarks[LEFT_SHOULDER]['y'] - landmarks[LEFT_WRIST]['y'])**2
            )
            
            # Forward reach approximation (how far forward the wrist is from shoulder)
            reach_forward = abs(landmarks[LEFT_WRIST]['x'] - landmarks[LEFT_SHOULDER]['x'])
            
            if arm_length > 0:
                metrics['reach_distance_ratio'] = reach_forward / arm_length
            else:
                metrics['reach_distance_ratio'] = 0
            
            metrics['stepped_during_task'] = 0.0  # Must be tracked over time
        
        return metrics
        
    except Exception as e:
        print(f"Error computing pose metrics: {e}")
        return {}

@app.route('/api/validate-pose', methods=['POST'])
def validate_pose_endpoint():
    """Validate pose quality and return detailed feedback"""
    try:
        data = request.get_json()
        pose_type = data.get('pose_type', 'partial_squat')
        landmarks = data.get('landmarks')
        
        if not landmarks or len(landmarks) < 33:
            return jsonify({"status": "error", "message": "Invalid landmarks"}), 400
        
        # Map common names to validator keys
        pose_type_map = {
            'squat': 'partial_squat',
            'heel_raise': 'heel_raises',
            'balance': 'single_leg_stance',
            'single_leg': 'single_leg_stance',
            'tandem': 'tandem_stance',
            'reach': 'functional_reach',
            'tree': 'tree_pose',
            'tree_left': 'tree_pose_left',
            'tree_right': 'tree_pose_right'
        }
        
        # Convert to validator key
        validator_key = pose_type_map.get(pose_type, pose_type)
        
        if validator_key not in POSE_DISPATCH:
            return jsonify({
                "status": "error",
                "message": f"Unknown pose type. Valid types: {list(POSE_DISPATCH.keys())}"
            }), 400
        
        # Compute metrics for this pose
        metrics = compute_pose_metrics(validator_key, landmarks)
        
        # Validate using the pose validator
        result = evaluate_pose(validator_key, metrics)
        
        return jsonify({
            "status": "success",
            "pose": result.pose,
            "score": result.score,
            "pass": result.pass_fail,
            "feedback": result.reasons,
            "metrics": result.metrics,
            "all_computed_metrics": metrics  # Show all computed values
        })
        
    except KeyError as e:
        return jsonify({
            "status": "error",
            "message": f"Missing required metric: {str(e)}. Some metrics may require temporal tracking."
        }), 400
    except Exception as e:
        print(f"Error validating pose: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/angles/<session_id>', methods=['GET'])
def get_angles(session_id):
    """Get calculated angles for a session"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT timestamp, shoulder_left, shoulder_right, elbow_left, elbow_right,
                   hip_left, hip_right, knee_left, knee_right
            FROM angle_data 
            WHERE session_id = ?
            ORDER BY timestamp DESC
        ''', (session_id,))
        
        data = cursor.fetchall()
        conn.close()
        
        angles = []
        for row in data:
            angles.append({
                'timestamp': row[0],
                'shoulder_left': row[1],
                'shoulder_right': row[2],
                'elbow_left': row[3],
                'elbow_right': row[4],
                'hip_left': row[5],
                'hip_right': row[6],
                'knee_left': row[7],
                'knee_right': row[8]
            })
        
        return jsonify({"angles": angles})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/export/<session_id>', methods=['GET'])
def export_angles(session_id):
    """Export all angle data for a session as JSON for external feedback system"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT timestamp, shoulder_left, shoulder_right, elbow_left, elbow_right,
                   hip_left, hip_right, knee_left, knee_right
            FROM angle_data 
            WHERE session_id = ?
            ORDER BY timestamp ASC
        ''', (session_id,))
        
        data = cursor.fetchall()
        conn.close()
        
        angles = []
        for row in data:
            angles.append({
                'timestamp': row[0],
                'joint_angles': {
                    'shoulder_left': row[1],
                    'shoulder_right': row[2],
                    'elbow_left': row[3],
                    'elbow_right': row[4],
                    'hip_left': row[5],
                    'hip_right': row[6],
                    'knee_left': row[7],
                    'knee_right': row[8]
                }
            })
        
        # Return data ready for your feedback system
        return jsonify({
            "session_id": session_id,
            "total_records": len(angles),
            "angle_data": angles
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/data/view', methods=['GET'])
def view_data():
    """View all captured data in a simple format"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get recent angle data
        cursor.execute('''
            SELECT timestamp, shoulder_left, shoulder_right, elbow_left, elbow_right,
                   hip_left, hip_right, knee_left, knee_right
            FROM angle_data 
            ORDER BY created_at DESC 
            LIMIT 20
        ''')
        
        data = cursor.fetchall()
        
        result = {
            "recent_data": [],
            "session_count": 0,
            "total_records": len(data)
        }
        
        for row in data:
            result["recent_data"].append({
                "timestamp": row[0],
                "angles": {
                    "shoulder_left": row[1],
                    "shoulder_right": row[2],
                    "elbow_left": row[3],
                    "elbow_right": row[4],
                    "hip_left": row[5],
                    "hip_right": row[6],
                    "knee_left": row[7],
                    "knee_right": row[8]
                }
            })
        
        cursor.execute('SELECT COUNT(DISTINCT session_id) FROM angle_data')
        result["session_count"] = cursor.fetchone()[0]
        
        conn.close()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/new-session', methods=['POST'])
def new_session_notification():
    """Handle notification that a new session has started"""
    try:
        data = request.get_json()
        session_id = data.get('sessionId')
        
        if session_id:
            print(f"New session started: {session_id}")
            # The live display will automatically show only this new session
            # since it queries for the most recent session ID
            return jsonify({"status": "success", "message": f"New session {session_id} acknowledged"})
        else:
            return jsonify({"status": "error", "message": "No session ID provided"}), 400
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "PTPal backend is running"})

@app.route('/', methods=['GET'])
def live_data_display():
    """Live data display in organized format - shows only current session, clears when new session starts"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get the most recent session ID (current session)
        cursor.execute('''
            SELECT session_id FROM angle_data 
            ORDER BY created_at DESC 
            LIMIT 1
        ''')
        current_session = cursor.fetchone()
        
        if not current_session:
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>PTPal Live Data</title>
                <meta http-equiv="refresh" content="3">
                <style>
                    body {{ font-family: monospace; margin: 20px; white-space: pre-line; background: #f0f0f0; }}
                </style>
            </head>
            <body>
            PTPal Live Data Monitor
            Session ID: No active session
            Current Session Records: 0
            ============================================================

            No data available. Start the camera to begin a new session.
            </body>
            </html>
            """
        
        current_session_id = current_session[0]
        
        # Get count for current session only
        cursor.execute('SELECT COUNT(*) FROM angle_data WHERE session_id = ?', (current_session_id,))
        session_count = cursor.fetchone()[0]
        
        # Get all angle data for current session only, ordered by newest first
        cursor.execute('''
            SELECT timestamp, shoulder_left, shoulder_right, elbow_left, elbow_right,
                   hip_left, hip_right, knee_left, knee_right, session_id
            FROM angle_data 
            WHERE session_id = ?
            ORDER BY created_at DESC
        ''', (current_session_id,))
        data = cursor.fetchall()
        conn.close()
        
        # Build organized output
        output = f"PTPal Live Data Monitor\n"
        output += f"Updates every 3 seconds\n"
        output += f"Session ID: {current_session_id}\n"
        output += f"Current Session Records: {session_count}\n"
        output += "=" * 60 + "\n\n"
        
        # Add each record in organized format
        for record in data:
            timestamp, shoulder_left, shoulder_right, elbow_left, elbow_right, hip_left, hip_right, knee_left, knee_right, session_id = record
            
            # Format timestamp with date and time (convert from UTC to local time)
            dt_utc = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            # Convert UTC to local time
            dt_local = dt_utc.astimezone()
            ts = dt_local.strftime('%Y-%m-%d %H:%M:%S')
            
            output += f"[{ts}]\n"
            output += f"  Shoulders: Left {shoulder_left:.1f}°, Right {shoulder_right:.1f}°\n"
            output += f"  Elbows:    Left {elbow_left:.1f}°, Right {elbow_right:.1f}°\n"
            output += f"  Hips:      Left {hip_left:.1f}°, Right {hip_right:.1f}°\n"
            output += f"  Knees:     Left {knee_left:.1f}°, Right {knee_right:.1f}°\n"
            output += "\n"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>PTPal Live Data</title>
            <meta http-equiv="refresh" content="3">
            <style>
                body {{ font-family: monospace; margin: 20px; white-space: pre-line; background: #f0f0f0; }}
            </style>
        </head>
        <body>
        {output}
        </body>
        </html>
        """
        
    except Exception as e:
        return f"Error loading data: {str(e)}"

if __name__ == '__main__':
    # Initialize database
    init_database()
    print("Starting PTPal Backend...")
    print("Backend will receive pose data for processing and storage")
    print("Running on HTTPS: https://localhost:8001")
    print("Note: You will see a security warning. Click 'Advanced' and 'Proceed to localhost'")
    
    # Run with HTTPS using SSL certificates
    app.run(
        debug=True, 
        host='localhost', 
        port=8001,
        ssl_context=('backend-cert.pem', 'backend-key.pem')
    )
