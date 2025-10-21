from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Expo push endpoint
EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

# Initialize SQLite DB with sample data
def init_db():
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            iban TEXT NOT NULL UNIQUE
        )
    ''')
    
    # Bank balances
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iban TEXT UNIQUE,
            balance REAL DEFAULT 0,
            FOREIGN KEY (iban) REFERENCES users (iban)
        )
    ''')
    
    # Push tokens
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS push_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            push_token TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Pending requests
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pending_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_id INTEGER,
            payer_id INTEGER,
            amount REAL,
            status TEXT DEFAULT 'pending',
            created_at TEXT,
            FOREIGN KEY (requester_id) REFERENCES users (id),
            FOREIGN KEY (payer_id) REFERENCES users (id)
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

def send_push(to_token, title, body):
    if not to_token:
        return
    push_data = {
        'to': to_token,
        'title': title,
        'body': body,
        'sound': 'default'
    }
    response = requests.post(EXPO_PUSH_URL, json=[push_data])
    if response.status_code != 200:
        print(f"Push send failed: {response.text}")

def get_user_token(user_id):
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    cursor.execute('SELECT push_token FROM push_tokens WHERE user_id = ?', (user_id,))
    token = cursor.fetchone()
    conn.close()
    return token[0] if token else None

def get_user_name(iban):
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM users WHERE iban = ?', (iban,))
    name = cursor.fetchone()
    conn.close()
    return name[0] if name else 'Unknown'

def transfer_amount(from_iban, to_iban, amount):
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    
    # Get balances
    cursor.execute('SELECT balance FROM bank_balances WHERE iban = ?', (from_iban,))
    from_result = cursor.fetchone()
    from_balance = from_result[0] if from_result else 0.0
    
    cursor.execute('SELECT balance FROM bank_balances WHERE iban = ?', (to_iban,))
    to_result = cursor.fetchone()
    to_balance = to_result[0] if to_result else 0.0
    
    # Transfer
    new_from_balance = from_balance - amount
    new_to_balance = to_balance + amount
    
    cursor.execute('INSERT OR REPLACE INTO bank_balances (iban, balance) VALUES (?, ?)', (from_iban, new_from_balance))
    cursor.execute('INSERT OR REPLACE INTO bank_balances (iban, balance) VALUES (?, ?)', (to_iban, new_to_balance))
    
    conn.commit()
    conn.close()
    return new_from_balance, new_to_balance

@app.route('/logout/<int:user_id>', methods=['POST'])
def logout(user_id):
    try:
        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM push_tokens WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
        print(f"Push token removed for user {user_id}")
        return jsonify({'message': 'Logged out, push token removed'}), 200
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': str(e)}), 500

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
        
        print(f"Login for user {user_id}: token {'provided' if push_token else 'skipped (e.g., web)'}")
        
        if push_token:
            conn = sqlite3.connect('payments.db')
            cursor = conn.cursor()
            cursor.execute('INSERT OR REPLACE INTO push_tokens (user_id, push_token) VALUES (?, ?)', (user_id, push_token))
            conn.commit()
            conn.close()
        
        return jsonify({'message': 'Logged in successfully', 'user_id': user_id})
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_money', methods=['POST'])
def add_money():
    try:
        data = request.json
        from_iban = data.get('from_iban')
        to_iban = data.get('to_iban')
        amount = data.get('amount', 10.0)

        if not from_iban or not to_iban:
            return jsonify({'error': 'from_iban and to_iban required'}), 400
        if from_iban == to_iban:
            return jsonify({'error': 'Cannot transfer to self'}), 400

        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        
        # Validate IBANs
        cursor.execute('SELECT id FROM users WHERE iban = ?', (from_iban,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Sender IBAN not found'}), 404
        cursor.execute('SELECT id FROM users WHERE iban = ?', (to_iban,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Receiver IBAN not found'}), 404
        
        # Transfer
        new_from_balance, new_to_balance = transfer_amount(from_iban, to_iban, amount)
        
        # Push to receiver (simplified)
        cursor.execute('SELECT id FROM users WHERE iban = ?', (to_iban,))
        receiver_id = cursor.fetchone()[0]
        token = get_user_token(receiver_id)
        sender_name = get_user_name(from_iban)
        send_push(token, 'Payment Received!', f'Sender: {sender_name}, Amount: ${amount}')
        
        conn.close()
        return jsonify({
            'message': f'Transferred ${amount} successfully',
            'from_iban': from_iban,
            'to_iban': to_iban,
            'amount': amount,
            'from_balance': new_from_balance,
            'to_balance': new_to_balance
        })
    except Exception as e:
        print(f"Transfer error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/request_money', methods=['POST'])
def request_money():
    try:
        data = request.json
        payer_iban = data.get('from_iban')  # Who pays (selected)
        requester_iban = data.get('to_iban')  # Who requests (current)
        amount = data.get('amount', 10.0)

        if not payer_iban or not requester_iban:
            return jsonify({'error': 'payer_iban and requester_iban required'}), 400

        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        
        # Validate IBANs
        cursor.execute('SELECT id FROM users WHERE iban = ?', (payer_iban,))
        payer_id = cursor.fetchone()
        if not payer_id:
            conn.close()
            return jsonify({'error': 'Payer IBAN not found'}), 404
        payer_id = payer_id[0]
        
        cursor.execute('SELECT id FROM users WHERE iban = ?', (requester_iban,))
        requester_id = cursor.fetchone()
        if not requester_id:
            conn.close()
            return jsonify({'error': 'Requester IBAN not found'}), 404
        requester_id = requester_id[0]
        
        if payer_id == requester_id:
            conn.close()
            return jsonify({'error': 'Cannot request from self'}), 400
        
        # Insert pending
        created_at = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO pending_requests (requester_id, payer_id, amount, status, created_at)
            VALUES (?, ?, ?, 'pending', ?)
        ''', (requester_id, payer_id, amount, created_at))
        request_id = cursor.lastrowid
        conn.commit()
        
        # Push to payer
        token = get_user_token(payer_id)
        requester_name = get_user_name(requester_iban)
        send_push(token, 'Money Request!', f'{requester_name} requests ${amount} from you. Open app to confirm/deny.')
        
        conn.close()
        return jsonify({'message': 'Request sent successfully', 'request_id': request_id, 'amount': amount})
    except Exception as e:
        print(f"Request error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/pending_requests', methods=['GET'])
def get_pending_requests():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    
    conn = sqlite3.connect('payments.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT pr.id, u.name as requester_name, pr.amount, pr.created_at
        FROM pending_requests pr
        JOIN users u ON pr.requester_id = u.id
        WHERE pr.payer_id = ? AND pr.status = 'pending'
        ORDER BY pr.created_at DESC
    ''', (user_id,))
    requests = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': row[0], 'requester_name': row[1], 'amount': row[2], 'created_at': row[3]
    } for row in requests])

@app.route('/approve_request/<int:request_id>', methods=['POST'])
def approve_request(request_id):
    try:
        data = request.json
        amount = data.get('amount', 10.0)
        
        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT requester_id, payer_id FROM pending_requests WHERE id = ? AND status = 'pending'
        ''', (request_id,))
        req = cursor.fetchone()
        if not req:
            conn.close()
            return jsonify({'error': 'Request not found or already processed'}), 404
        requester_id, payer_id = req
        
        # Fetch IBANs
        cursor.execute('SELECT iban FROM users WHERE id = ?', (payer_id,))
        payer_iban = cursor.fetchone()[0]
        cursor.execute('SELECT iban FROM users WHERE id = ?', (requester_id,))
        requester_iban = cursor.fetchone()[0]
        
        # Transfer
        new_payer_balance, new_requester_balance = transfer_amount(payer_iban, requester_iban, amount)
        
        # Update status
        cursor.execute('UPDATE pending_requests SET status = "approved" WHERE id = ?', (request_id,))
        conn.commit()
        
        # Push to requester (simplified)
        token = get_user_token(requester_id)
        payer_name = get_user_name(payer_iban)
        send_push(token, 'Request Approved!', f'Your request from {payer_name} for ${amount} approved! Sender: {payer_name}, Amount: ${amount}')
        
        conn.close()
        return jsonify({'message': 'Request approved and transferred', 'amount': amount})
    except Exception as e:
        print(f"Approve error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/deny_request/<int:request_id>', methods=['POST'])
def deny_request(request_id):
    try:
        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT requester_id, payer_id, amount FROM pending_requests WHERE id = ? AND status = 'pending'
        ''', (request_id,))
        req = cursor.fetchone()
        if not req:
            conn.close()
            return jsonify({'error': 'Request not found or already processed'}), 404
        requester_id, payer_id, amount = req
        
        # Fetch payer name
        cursor.execute('SELECT name FROM users WHERE id = ?', (payer_id,))
        payer_name = cursor.fetchone()[0]
        
        # Update status
        cursor.execute('UPDATE pending_requests SET status = "denied" WHERE id = ?', (request_id,))
        conn.commit()
        
        # Push to requester
        token = get_user_token(requester_id)
        send_push(token, 'Request Denied', f'Your request from {payer_name} for ${amount} denied. Sender: {payer_name}, Amount: ${amount}')
        
        conn.close()
        return jsonify({'message': 'Request denied'})
    except Exception as e:
        print(f"Deny error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')