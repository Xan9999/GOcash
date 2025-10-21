from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import requests  # New: For Expo push

app = Flask(__name__)
CORS(app)

# Expo push endpoint
EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

# Initialize SQLite DB with sample data
def init_db():
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    
    # Existing users and bank_balances tables...
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            iban TEXT NOT NULL UNIQUE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iban TEXT UNIQUE,
            balance REAL DEFAULT 0,
            FOREIGN KEY (iban) REFERENCES users (iban)
        )
    ''')
    
    # New: push_tokens table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS push_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            push_token TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert sample users if empty
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
        'id': row[0], 'name': row[1], 'email': row[2], 'phone': row[3],
        'iban': row[4], 'balance': row[5]
    } for row in users])

@app.route('/login/<int:user_id>', methods=['POST'])
def login(user_id):
    try:
        data = request.json
        push_token = data.get('pushToken')
        
        # Optional: Log for debug
        print(f"Login for user {user_id}: token {'provided' if push_token else 'skipped (e.g., web)'}")
        
        if push_token:  # Only store if provided (mobile)
            conn = sqlite3.connect('payments.db')
            cursor = conn.cursor()
            # Upsert token (latest per user)
            cursor.execute('''
                INSERT OR REPLACE INTO push_tokens (user_id, push_token)
                VALUES (?, ?)
            ''', (user_id, push_token))
            conn.commit()
            conn.close()
        
        return jsonify({'message': 'Logged in successfully', 'user_id': user_id})
    except Exception as e:
        print(f"Login error: {e}")  # Debug log
        return jsonify({'error': str(e)}), 500

@app.route('/add_money/<iban>', methods=['POST'])
def add_money(iban):
    try:
        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        
        # Get current balance
        cursor.execute('SELECT balance FROM bank_balances WHERE iban = ?', (iban,))
        result = cursor.fetchone()
        
        if result is None:
            new_balance = 10.0
            cursor.execute('INSERT INTO bank_balances (iban, balance) VALUES (?, ?)', (iban, new_balance))
        else:
            new_balance = result[0] + 10.0
            cursor.execute('UPDATE bank_balances SET balance = ? WHERE iban = ?', (new_balance, iban))
        
        # Get user_id for notification
        cursor.execute('SELECT id FROM users WHERE iban = ?', (iban,))
        user_row = cursor.fetchone()
        if not user_row:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        user_id = user_row[0]
        
        # Get push token
        cursor.execute('SELECT push_token FROM push_tokens WHERE user_id = ?', (user_id,))
        token_row = cursor.fetchone()
        if token_row:
            push_token = token_row[0]
            # Send Expo push
            push_data = {
                'to': push_token,
                'title': 'Payment Received!',
                'body': 'Someone sent you $10. Check your balance!',
                'sound': 'default',
                'data': {'balance': new_balance}
            }
            response = requests.post(EXPO_PUSH_URL, json=[push_data])  # Batch as list
            if response.status_code != 200:
                print(f"Push send failed: {response.text}")  # Log, don't fail endpoint
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Added 10 to balance', 'iban': iban, 'new_balance': new_balance})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')  # Bind to network