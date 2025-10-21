from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize SQLite DB
def init_db():
    conn = sqlite3.connect('entries.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/add_entry', methods=['POST'])
def add_entry():
    conn = sqlite3.connect('entries.db')
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()
    cursor.execute('INSERT INTO entries (timestamp) VALUES (?)', (timestamp,))
    conn.commit()
    entry_id = cursor.lastrowid
    conn.close()
    return jsonify({'message': 'Entry added successfully', 'id': entry_id, 'timestamp': timestamp})

@app.route('/entries', methods=['GET'])  # Bonus: Optional endpoint to view all entries
def get_entries():
    conn = sqlite3.connect('entries.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM entries ORDER BY id DESC')
    entries = cursor.fetchall()
    conn.close()
    return jsonify([{'id': row[0], 'timestamp': row[1]} for row in entries])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
