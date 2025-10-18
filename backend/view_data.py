import sqlite3
from datetime import datetime

def view_all_data():
    """View all captured pose and angle data"""
    conn = sqlite3.connect('ptpal_data.db')
    cursor = conn.cursor()
    
    # Show recent angle data
    print("=" * 80)
    print("📊 RECENT JOINT ANGLE DATA")
    print("=" * 80)
    cursor.execute('''
        SELECT timestamp, shoulder_left, shoulder_right, elbow_left, elbow_right,
               hip_left, hip_right, knee_left, knee_right
        FROM angle_data 
        ORDER BY created_at DESC 
        LIMIT 10
    ''')
    
    rows = cursor.fetchall()
    if rows:
        print(f"{'Timestamp':20} {'ShL':6} {'ShR':6} {'ElL':6} {'ElR':6} {'HpL':6} {'HpR':6} {'KnL':6} {'KnR':6}")
        print("-" * 80)
        for row in rows:
            timestamp = row[0][:16] if len(row[0]) > 16 else row[0]
            print(f"{timestamp:20} {row[1]:6.1f} {row[2]:6.1f} {row[3]:6.1f} {row[4]:6.1f} {row[5]:6.1f} {row[6]:6.1f} {row[7]:6.1f} {row[8]:6.1f}")
    else:
        print("No angle data found yet.")
    
    # Show session summary
    print("\n" + "=" * 80)
    print("📋 SESSION SUMMARY")
    print("=" * 80)
    cursor.execute('SELECT COUNT(DISTINCT session_id) FROM angle_data')
    session_count = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM angle_data')
    total_records = cursor.fetchone()[0]
    
    print(f"Total Sessions: {session_count}")
    print(f"Total Records: {total_records}")
    print(f"Database Size: {sum(1 for _ in open('ptpal_data.db', 'rb'))} records estimated")
    
    # Show latest session
    cursor.execute('''
        SELECT session_id, COUNT(*), MIN(timestamp), MAX(timestamp)
        FROM angle_data 
        GROUP BY session_id 
        ORDER BY MAX(created_at) DESC 
        LIMIT 3
    ''')
    
    sessions = cursor.fetchall()
    if sessions:
        print(f"\nRecent Sessions:")
        for session in sessions:
            print(f"  Session: {session[0][:20]}... ({session[1]} records)")
    
    conn.close()

if __name__ == "__main__":
    view_all_data()
