from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize SQLite DB with sample data
def init_db():
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            iban TEXT NOT NULL UNIQUE
        )
    ''')
    
    # Create bank_balances table (fixed: only 'id' as PK; 'iban' as UNIQUE)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iban TEXT UNIQUE,
            balance REAL DEFAULT 0,
            FOREIGN KEY (iban) REFERENCES users (iban)
        )
    ''')
    
    # Insert sample users if table is empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        sample_users = [
            ('Alice Johnson', 'alice@example.com', '+1-555-0101', 'ALICE1234567890'),
            ('Bob Smith', 'bob@example.com', '+1-555-0102', 'BOB1234567891'),
            ('Carol Davis', 'carol@example.com', '+1-555-0103', 'CAROL1234567892'),
            ('David Wilson', 'david@example.com', '+1-555-0104', 'DAVID1234567893'),
            ('Eve Brown', 'eve@example.com', '+1-555-0105', 'EVE1234567894')
        ]
        cursor.executemany('INSERT INTO users (name, email, phone, iban) VALUES (?, ?, ?, ?)', sample_users)
        
        # Initialize balances for new users (INSERT OR IGNORE avoids duplicates)
        for _, _, _, iban in sample_users:
            cursor.execute('INSERT OR IGNORE INTO bank_balances (iban, balance) VALUES (?, 0)', (iban,))
    
    conn.commit()
    conn.close()

init_db()

@app.route('/users', methods=['GET'])
def get_users():
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.id, u.name, u.email, u.phone, u.iban, COALESCE(b.balance, 0) as balance
        FROM users u
        LEFT JOIN bank_balances b ON u.iban = b.iban
        ORDER BY u.id
    ''')
    users = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': row[0], 'name': row[1], 'phone': row[3]
    } for row in users])

@app.route('/add_money/<iban>', methods=['POST'])
def add_money(iban):
    try:
        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        
        # Get current balance (or 0 if none)
        cursor.execute('SELECT balance FROM bank_balances WHERE iban = ?', (iban,))
        result = cursor.fetchone()

        new_balance = result[0] + 10.0
        cursor.execute('UPDATE bank_balances SET balance = ? WHERE iban = ?', (new_balance, iban))

        conn.commit()
        conn.close()
        return jsonify({'message': 'Added 10 to balance', 'iban': iban, 'new_balance': new_balance})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
