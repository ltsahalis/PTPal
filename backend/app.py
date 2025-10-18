from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
import math

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
    app.run(debug=True, host='localhost', port=8001)
