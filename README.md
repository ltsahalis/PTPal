# PTPal - Backend Breakdown 
## Please read through all of this to understad how the system works


## Backend Data Structure

```
PTPal/
├── backend/                # Python Flask backend
│   ├── app.py              # Main backend application
│   ├── requirements.txt    # Python dependencies
│   ├── setup.sh           # Setup script
│   ├── view_data.py       # Data viewing utility
│   └── ptpal_data.db      # SQLite database (created automatically)
├── index.html              # Frontend web interface
├── script.js               # Frontend JavaScript
├── styles.css              # Frontend styling
└── http-server.js          # Node.js HTTP server
```

##  Quick Start

### Prerequisites

- **Python 3.7+** installed on your system
- **Node.js** installed (for frontend server)
- **Git** for accessing the repository

### 1. Clone the Repository and Switch to Data Storage Branch

**⚠️ Important**: Make sure you're on the `data_storage` branch, NOT `main`. All backend functionality is currently in this branch.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Make setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

**Alternative Manual Setup:**
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Start the Backend Server

```bash
# Make sure you're in the backend directory
cd backend

# Activate virtual environment (if not already active)
source venv/bin/activate

# Start the Flask backend
python3 app.py
```

The backend will start on `http://localhost:8001`

### 4. Start the Frontend Server

In a **new terminal window**:

```bash
# Navigate to project root
cd PTPal

# Start the HTTP server
node http-server.js
```

The frontend will be available at `http://localhost:3000`

## How It Works

### Data Flow
1. **Frontend** (`localhost:3000`): Captures webcam video and runs MediaPipe BlazePose
2. **Backend** (`localhost:8001`): Receives pose data, calculates joint angles, stores in SQLite
3. **Database**: Stores raw landmarks and calculated angles with timestamps
4. **Display** (`localhost:8001`): Shows live data from current session only

### Session Management
- **New Session**: Created when "Start Camera" is pressed
- **Data Collection**: Continuous while the camera is active and you are on the localhost3000
- **Session End**: When "Stop Camera" is pressed
- **Display**: Shows only current session data (old sessions preserved in database) & loads most recent from top to bottom

## 🔧 API Endpoints

### Data Collection
- `POST /api/pose-data` - Receive pose landmarks from frontend
- `POST /api/new-session` - Notify backend of new session start

### Data Access
- `GET /` - Live data display (current session only)
- `GET /api/angles/<session_id>` - Get all angles for specific session
- `GET /api/export/<session_id>` - Export session data as JSON
- `GET /api/data/view` - Summary of recent data and sessions
- `GET /api/health` - Health check endpoint

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

# Restart HTTP server
node http-server.js
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
- Visit `http://localhost:8001` to see current session data
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
curl "http://localhost:8001/api/export/your_session_id"

# Direct database query
sqlite3 ptpal_data.db "SELECT * FROM angle_data WHERE session_id = 'your_session_id';"
```

## Notes

- All data is permanently stored in SQLite
- Only current session is visible on live display
- Historical sessions can be accessed via API or database
- System handles timezone conversion automatically
- Backend must be running for data collection to work

---

**Branch**: `data_storage` (not `main`)  
**Backend Port**: 8001  
**Frontend Port**: 3000  
**Database**: `backend/ptpal_data.db`