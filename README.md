# PTPal - Physical Therapy Pal
## Real-time Pose Detection with Data Storage & Frame Tracking

Please read through all of this to understand how the system works.


## Backend Data Structure

```
PTPal/
├── backend/                # Python Flask backend
│   ├── app.py              # Main backend application
│   ├── requirements.txt    # Python dependencies
│   ├── view_data.py       # Data viewing utility
│   └── ptpal_data.db      # SQLite database (created automatically)
├── setup.sh                # One-time setup script (⭐ RUN THIS FIRST)
├── start.sh                # Launch script (starts everything)
├── https-server.js         # Node.js HTTPS server (required for camera)
├── index.html              # Frontend web interface
├── script.js               # Frontend JavaScript (pose detection + data storage)
├── styles.css              # Frontend styling
├── INSTALLATION.md         # Detailed installation guide
└── README.md               # This file
```

## Features

- **Out-of-Frame Detection**: Real-time visual feedback when you move out of frame
- **Data Storage**: All pose data saved to SQLite database with session tracking
- **BlazePose Integration**: High-accuracy pose estimation using MediaPipe
- **Angle Calculation**: Automatic joint angle computation and storage
- **Session Management**: Track multiple exercise sessions separately

---

## Quick Start

### Prerequisites

- **Python 3.7+** installed on your system
- **Node.js** installed (for frontend server)
- **OpenSSL** (usually pre-installed on macOS/Linux)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PTPal_Demo
```

### 2. Run One-Time Setup

This will generate SSL certificates, create virtual environment, and install all dependencies:

```bash
chmod +x setup.sh
./setup.sh
```

### 3. Start PTPal

This single command starts both backend and frontend servers:

```bash
./start.sh
```

You should see:
```
Backend running on https://localhost:8001
Frontend running on https://localhost:3000
```

### 4. Open in Browser

1. Navigate to: **https://localhost:3000**
2. You'll see a security warning (normal for self-signed certificates)
3. Click **"Advanced"** → **"Proceed to localhost (unsafe)"**
4. Grant camera permissions when prompted
5. Click **"Start Camera"** to begin

### 5. Stop PTPal

Press **Ctrl+C** in the terminal where `start.sh` is running.

---

## 📖 Manual Setup (Alternative)

If you prefer to run components separately, see [INSTALLATION.md](INSTALLATION.md) for detailed instructions.

**Quick version:**

**Terminal 1 - Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Generate SSL certificates for HTTPS
bash generate_certificates.sh
python3 app.py
```

**Terminal 2 - Frontend:**
```bash
# Generate SSL certificates (one-time)
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"

# Start HTTPS server
node https-server.js
```

Then open: **https://localhost:3000**

## How It Works

### Data Flow
1. **Frontend** (`https://localhost:3000`): Captures webcam video and runs MediaPipe BlazePose
2. **Out-of-Frame Detection**: Real-time border feedback (green=good, yellow=partially out, red=out of frame)
3. **Backend** (`https://localhost:8001`): Receives pose data, calculates joint angles, stores in SQLite
4. **Database**: Stores raw landmarks and calculated angles with timestamps
5. **Display** (`https://localhost:8001`): Shows live data from current session only

### Session Management
- **New Session**: Created when "Start Camera" is pressed
- **Data Collection**: Continuous while the camera is active and you are on the localhost3000
- **Session End**: When "Stop Camera" is pressed
- **Display**: Shows only current session data (old sessions preserved in database) & loads most recent from top to bottom

## 🔧 API Endpoints

### Data Collection
- `POST /api/pose-data` - Receive pose landmarks from frontend
- `POST /api/new-session` - Notify backend of new session start
- `POST /api/validate-pose` - Validate pose quality and return feedback

### Data Access
- `GET /` - Live data display (current session only)
- `GET /api/angles/<session_id>` - Get all angles for specific session
- `GET /api/export/<session_id>` - Export session data as JSON
- `GET /api/data/view` - Summary of recent data and sessions
- `GET /api/health` - Health check endpoint

### Pose Validation Usage

**Supported Pose Types:**
- `partial_squat` (alias: `squat`) - Validates squat depth, knee alignment, heel position, trunk lean
- `heel_raises` (alias: `heel_raise`) - Validates heel height, bilateral symmetry, ankle stability  
- `single_leg_stance` (alias: `balance`, `single_leg`) - Validates hold time, sway, pelvic level
- `tandem_stance` (alias: `tandem`) - Validates heel-to-toe alignment, trunk lean, hold time
- `functional_reach` (alias: `reach`) - Validates reach distance, trunk flexion, foot stability
- `tree_pose` (alias: `tree`) - Validates pelvic level, sway, arm alignment, hold time

**Example: Validate a squat**
```javascript
fetch('http://localhost:8001/api/validate-pose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        pose_type: 'partial_squat',  // or use alias 'squat'
        landmarks: results.poseLandmarks  // from BlazePose (33 points)
    })
}).then(r => r.json()).then(data => {
    console.log(`Score: ${data.score}/100`);
    console.log(`Pass: ${data.pass}`);
    console.log(`Feedback: ${data.feedback.join(', ')}`);
    console.log(`Metrics:`, data.metrics);
});
```

**Example Response:**
```json
{
  "status": "success",
  "pose": "Partial Squat",
  "score": 75,
  "pass": true,
  "feedback": [
    "Go deeper: knee flexion 35° < 45°."
  ],
  "metrics": {
    "knee_flexion_deg": 35.2,
    "hip_knee_ankle_alignment_deg": 7.5,
    "heel_height_cm": 0.3,
    "trunk_forward_lean_deg": 22.1
  }
}
```

**Computed Metrics:**

Knee flexion angles (left, right, average)
- Hip-knee-ankle alignment (frontal plane)
- Heel height in cm (approximated)
- Trunk forward lean angle
- Bilateral symmetry percentage
- Pelvic drop/obliquity
- Arm overhead alignment
- Reach distance ratio
- Hold time (requires temporal tracking - set to 0)
- Sway peak (requires temporal tracking - set to 0)

**Test the validation:**
```bash
cd backend
python test_validation.py
```

## Database Schema

### `pose_data` Table
- Raw MediaPipe landmarks (33 body points per frame)
- Timestamp, session_id, landmarks JSON

### `angle_data` Table
- Calculated joint angles (8 angles per frame):
  - `shoulder_left`, `shoulder_right`
  - `elbow_left`, `elbow_right` 
  - `hip_left`, `hip_right`
  - `knee_left`, `knee_right`

## Troubleshooting

### Backend Issues
```bash
# Check if port 8001 is in use
lsof -i :8001

# Kill process if needed
kill -9 <PID>

# Check Python dependencies
pip list | grep flask
```

### Frontend Issues
```bash
# Check if port 3000 is in use
lsof -i :3000

# Restart HTTPS server
node https-server.js

# If SSL certificate issues, regenerate certificates
rm key.pem cert.pem
rm backend/backend-*.pem
./setup.sh
```

### Database Issues
```bash
# View recent data
cd backend
python3 view_data.py

# Check database directly
sqlite3 ptpal_data.db ".tables"
sqlite3 ptpal_data.db "SELECT COUNT(*) FROM angle_data;"
```

## Viewing Your Data

### Live Display
- Visit `https://localhost:8001` to see current session data
- Auto-refreshes every 3 seconds
- Shows only active session (old sessions hidden)

### Command Line
```bash
cd backend
python3 view_data.py  # Shows recent data and statistics
```

### Database Access
```bash
cd backend
sqlite3 ptpal_data.db

# List all sessions
SELECT DISTINCT session_id, COUNT(*) FROM angle_data GROUP BY session_id;

# View specific session
SELECT * FROM angle_data WHERE session_id = 'your_session_id';
```

### Export Data
```bash
# Via API (if backend running)
curl -k "https://localhost:8001/api/export/your_session_id"

# Direct database query
sqlite3 ptpal_data.db "SELECT * FROM angle_data WHERE session_id = 'your_session_id';"
```

## Notes

- All data is permanently stored in SQLite
- Only current session is visible on live display
- Historical sessions can be accessed via API or database
- System handles timezone conversion automatically
- Backend must be running for data collection to work
- Out-of-frame detection provides real-time visual feedback

---

## 📝 Port Information

**Backend (HTTPS)**: https://localhost:8001  
**Frontend (HTTPS)**: https://localhost:3000  
**Database**: `backend/ptpal_data.db`