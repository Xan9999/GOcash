from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import requests
from datetime import datetime
import os
import json # Import json for handling JSON strings

app = Flask(__name__)
CORS(app)

# Expo push endpoint
EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

DB_PATH = 'payments.db'

def db_connect():
    return sqlite3.connect(DB_PATH)

# Utility function to send push notifications
def send_push(token, title, body):
    if not token:
        print("No push token available for user.")
        return

    message = {
        'to': token,
        'title': title,
        'body': body,
        '_displayInForeground': True,
    }

    try:
        response = requests.post(
            EXPO_PUSH_URL,
            json=message,
            headers={'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json'},
            timeout=5
        )
        response.raise_for_status()
        print(f"Push notification sent successfully to {token}. Status: {response.status_code}")
        # print("Response body:", response.json()) # Verbose logging removed
    except requests.exceptions.RequestException as e:
        print(f"Error sending push notification: {e}")

# Utility to get push token
def get_user_token(user_id):
    conn = db_connect()
    cursor = conn.cursor()
    cursor.execute('SELECT push_token FROM push_tokens WHERE user_id = ?', (user_id,))
    token = cursor.fetchone()
    conn.close()
    return token[0] if token else None

# Initialize SQLite DB with sample data and handle migration to integer-cents
def init_db():
    needs_seed = False
    first_time = not os.path.exists(DB_PATH)
    conn = db_connect()
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

    # Bank balances (in integer cents)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iban TEXT UNIQUE,
            balance_cents INTEGER DEFAULT 0,
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

    # Pending requests (amount in cents)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pending_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_id INTEGER NOT NULL,
            payer_id INTEGER NOT NULL,
            amount_cents INTEGER NOT NULL,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (requester_id) REFERENCES users (id),
            FOREIGN KEY (payer_id) REFERENCES users (id)
        )
    ''')
    
    # --- NEW: Groups Table ---
    # Members will be stored as a JSON array of user IDs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            creator_id INTEGER NOT NULL,
            member_ids TEXT NOT NULL, -- Stored as JSON string: [id1, id2, ...]
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users (id)
        )
    ''')

    # Seed data if DB is new
    if first_time:
        print("Seeding new database...")
        needs_seed = True
        
    # Check if we need to seed users (robust way)
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        needs_seed = True

    if needs_seed:
        users = [
            ("Alice Johnson", "alice@example.com", "123-456-7890", "DE123456780001"),
            ("Bob Smith", "bob@example.com", "123-456-7891", "DE123456780002"),
            ("Charlie Brown", "charlie@example.com", "123-456-7892", "DE123456780003"),
            ("David Lee", "david@example.com", "123-456-7893", "DE123456780004"),
        ]
        
        for name, email, phone, iban in users:
            cursor.execute('''
                INSERT INTO users (name, email, phone, iban) VALUES (?, ?, ?, ?)
            ''', (name, email, phone, iban))
            
            # Initial balance 100 EUR = 10000 cents
            cursor.execute('''
                INSERT INTO bank_balances (iban, balance_cents) VALUES (?, ?)
            ''', (iban, 10000))

        # Seed a split request for testing (Alice owes Bob 5.00)
        # Assuming Alice is user 1, Bob is user 2
        cursor.execute('''
            INSERT INTO pending_requests (requester_id, payer_id, amount_cents, status) 
            VALUES (?, ?, ?, ?)
        ''', (2, 1, 500, 'pending'))
        
        # --- NEW: Seed a Group ---
        # Assuming users 1 (Alice) and 2 (Bob) and 3 (Charlie) exist
        # Alice creates a group "Dinner Crew" with Bob and Charlie (IDs 2 and 3). Creator is 1.
        member_ids = json.dumps([2, 3]) # Storing as a JSON array string
        cursor.execute('''
            INSERT INTO groups (name, creator_id, member_ids) 
            VALUES (?, ?, ?)
        ''', ("Dinner Crew", 1, member_ids))
        
        conn.commit()

    conn.close()

# Ensure DB is initialized
init_db()

# --- Utility Functions --- (Defined above, kept for context in original app.py)

# --- Routes ---

@app.route('/users', methods=['GET'])
def get_users():
    conn = db_connect()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, phone, iban FROM users')
    users_data = cursor.fetchall()
    
    # Fetch balances
    users_list = []
    for id, name, email, phone, iban in users_data:
        cursor.execute('SELECT balance_cents FROM bank_balances WHERE iban = ?', (iban,))
        balance_cents = cursor.fetchone()[0] if cursor.rowcount > 0 else 0
        users_list.append({
            'id': id,
            'name': name,
            'email': email,
            'phone': phone,
            'iban': iban,
            'balance': balance_cents / 100.0
        })

    conn.close()
    return jsonify(users_list)

# Route for login and updating push token
@app.route('/login/<int:user_id>', methods=['POST'])
def login(user_id):
    try:
        data = request.get_json()
        push_token = data.get('pushToken')
        
        conn = db_connect()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
        if cursor.fetchone() is None:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        if push_token:
            # Insert or update the push token
            cursor.execute('''
                INSERT OR REPLACE INTO push_tokens (user_id, push_token) 
                VALUES (?, ?)
            ''', (user_id, push_token))
            conn.commit()
            print(f"Token updated for user {user_id}")
            
        conn.close()
        return jsonify({'message': 'Login successful and token updated (if provided)'})
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

# Route for logout (clearing push token)
@app.route('/logout/<int:user_id>', methods=['POST'])
def logout(user_id):
    try:
        conn = db_connect()
        cursor = conn.cursor()
        # Remove the token
        cursor.execute('UPDATE push_tokens SET push_token = NULL WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Logged out successfully (token cleared)'})
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_money', methods=['POST'])
def add_money():
    try:
        data = request.get_json()
        from_iban = data['from_iban']
        to_iban = data['to_iban']
        amount_cents = int(data['amount_cents'])
        
        if amount_cents <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        conn = db_connect()
        cursor = conn.cursor()

        # Deduct from sender
        cursor.execute('''
            UPDATE bank_balances SET balance_cents = balance_cents - ? WHERE iban = ? AND balance_cents >= ?
        ''', (amount_cents, from_iban, amount_cents))
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Sender not found or insufficient funds'}), 400

        # Add to recipient
        cursor.execute('''
            UPDATE bank_balances SET balance_cents = balance_cents + ? WHERE iban = ?
        ''', (amount_cents, to_iban))

        # Get recipient ID and name for push notification
        cursor.execute('SELECT id, name FROM users WHERE iban = ?', (to_iban,))
        to_user = cursor.fetchone()
        to_user_id = to_user[0]
        to_user_name = to_user[1]
        
        # Get sender name
        cursor.execute('SELECT name FROM users WHERE iban = ?', (from_iban,))
        from_user_name = cursor.fetchone()[0]

        conn.commit()
        conn.close()
        
        token = get_user_token(to_user_id)
        send_push(token, 'Money Received!', f'You received €{amount_cents/100:.2f} from {from_user_name}.')

        return jsonify({'message': 'Money transferred', 'amount_cents': amount_cents})
    except Exception as e:
        print(f"Transfer error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/request_money', methods=['POST'])
def request_money():
    try:
        data = request.get_json()
        requester_iban = data['to_iban'] # The user requesting the money
        payer_iban = data['from_iban']   # The user who owes the money
        amount_cents = int(data['amount_cents'])
        
        if amount_cents <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        conn = db_connect()
        cursor = conn.cursor()
        
        # Get IDs
        cursor.execute('SELECT id, name FROM users WHERE iban = ?', (requester_iban,))
        requester_id, requester_name = cursor.fetchone()
        
        cursor.execute('SELECT id, name FROM users WHERE iban = ?', (payer_iban,))
        payer_id, payer_name = cursor.fetchone()

        # Check if a similar pending request exists to prevent spamming
        cursor.execute('''
            SELECT id FROM pending_requests 
            WHERE requester_id = ? AND payer_id = ? AND amount_cents = ? AND status = 'pending'
        ''', (requester_id, payer_id, amount_cents))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Similar pending request already exists'}), 409 # Conflict

        # Create request
        cursor.execute('''
            INSERT INTO pending_requests (requester_id, payer_id, amount_cents) 
            VALUES (?, ?, ?)
        ''', (requester_id, payer_id, amount_cents))
        conn.commit()

        # Send notification to the Payer (who needs to approve/deny)
        token = get_user_token(payer_id)
        send_push(token, 'Money Request', f'A request for €{amount_cents/100:.2f} received from {requester_name}.')

        conn.close()
        return jsonify({'message': 'Money request sent', 'amount_cents': amount_cents})
    except Exception as e:
        print(f"Request money error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/pending_requests', methods=['GET'])
def get_pending_requests():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        conn = db_connect()
        cursor = conn.cursor()
        
        # Get requests where current user is the Payer (needs to act)
        cursor.execute('''
            SELECT pr.id, pr.requester_id, pr.amount_cents, u.name as requester_name
            FROM pending_requests pr
            JOIN users u ON pr.requester_id = u.id
            WHERE pr.payer_id = ? AND pr.status = 'pending'
            ORDER BY pr.created_at DESC
        ''', (user_id,))
        
        requests_list = []
        for id, requester_id, amount_cents, requester_name in cursor.fetchall():
            requests_list.append({
                'id': id,
                'requester_id': requester_id,
                'amount_cents': amount_cents,
                'amount': amount_cents / 100.0,
                'requester_name': requester_name
            })
            
        conn.close()
        return jsonify(requests_list)
    except Exception as e:
        print(f"Fetch requests error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/approve_request/<int:request_id>', methods=['POST'])
def approve_request(request_id):
    try:
        # Payer is implicit in this process (must be current user in front-end)
        conn = db_connect()
        cursor = conn.cursor()
        
        # Select request details
        cursor.execute('''
            SELECT requester_id, payer_id, amount_cents FROM pending_requests WHERE id = ? AND status = 'pending'
        ''', (request_id,))
        req = cursor.fetchone()
        
        if not req:
            conn.close()
            return jsonify({'error': 'Request not found or already processed'}), 404
            
        requester_id, payer_id, amount_cents = req

        # Get IBANs
        cursor.execute('SELECT iban, name FROM users WHERE id = ?', (payer_id,))
        payer_iban, payer_name = cursor.fetchone()
        cursor.execute('SELECT iban, name FROM users WHERE id = ?', (requester_id,))
        requester_iban, requester_name = cursor.fetchone()
        
        # Start transaction: Deduct from Payer
        cursor.execute('''
            UPDATE bank_balances SET balance_cents = balance_cents - ? WHERE iban = ? AND balance_cents >= ?
        ''', (amount_cents, payer_iban, amount_cents))
        if cursor.rowcount == 0:
            conn.close()
            # Send notification to requester that payer has insufficient funds
            token = get_user_token(requester_id)
            send_push(token, 'Request Failed', f'Your request from {payer_name} for €{amount_cents/100:.2f} failed due to insufficient funds.')
            return jsonify({'error': 'Insufficient funds to approve request'}), 400

        # Add to Requester
        cursor.execute('''
            UPDATE bank_balances SET balance_cents = balance_cents + ? WHERE iban = ?
        ''', (amount_cents, requester_iban))

        # Update request status
        cursor.execute('UPDATE pending_requests SET status = "approved" WHERE id = ?', (request_id,))
        conn.commit()
        
        # Notify Requester
        token = get_user_token(requester_id)
        send_push(token, 'Request Approved', f'{payer_name} approved your request for €{amount_cents/100:.2f}.')

        conn.close()
        return jsonify({'message': 'Request approved and transferred', 'amount_cents': amount_cents})
    except Exception as e:
        print(f"Approve error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/deny_request/<int:request_id>', methods=['POST'])
def deny_request(request_id):
    try:
        conn = db_connect()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT requester_id, payer_id, amount_cents FROM pending_requests WHERE id = ? AND status = 'pending'
        ''', (request_id,))
        req = cursor.fetchone()
        if not req:
            conn.close()
            return jsonify({'error': 'Request not found or already processed'}), 404
        requester_id, payer_id, amount_cents = req

        # Fetch payer name
        cursor.execute('SELECT name FROM users WHERE id = ?', (payer_id,))
        # Check if the fetch was successful before accessing index 0
        payer_name_data = cursor.fetchone()
        payer_name = payer_name_data[0] if payer_name_data else "Unknown"

        cursor.execute('UPDATE pending_requests SET status = "denied" WHERE id = ?', (request_id,))
        conn.commit()

        token = get_user_token(requester_id)
        send_push(token, 'Request Denied', f'Your request from {payer_name} for €{amount_cents/100:.2f} denied.')

        conn.close()
        return jsonify({'message': 'Request denied'})
    except Exception as e:
        print(f"Deny error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/split_request', methods=['POST'])
def split_request():
    try:
        data = request.get_json()
        payer_iban = data['payer_iban']
        recipients = data['recipients'] # [{'iban': '...', 'amount_cents': 1000}, ...]
        total_cents = int(data['total_cents'])
        
        if total_cents <= 0:
            return jsonify({'error': 'Total amount must be positive'}), 400

        conn = db_connect()
        cursor = conn.cursor()
        
        # Get Payer ID and name (The one creating the requests)
        cursor.execute('SELECT id, name FROM users WHERE iban = ?', (payer_iban,))
        payer_id, payer_name = cursor.fetchone()
        
        # Store requests and notify payers (recipients in the split)
        new_request_count = 0
        for recipient in recipients:
            recipient_iban = recipient['iban']
            amount_cents = int(recipient['amount_cents'])
            
            # Find the recipient's user ID (they are the Payer in this request)
            cursor.execute('SELECT id, name FROM users WHERE iban = ?', (recipient_iban,))
            recipient_user_data = cursor.fetchone()
            if not recipient_user_data: continue # Skip if user not found
            recipient_id, recipient_name = recipient_user_data
            
            # Check for existing request to prevent duplicates (same as request_money)
            cursor.execute('''
                SELECT id FROM pending_requests 
                WHERE requester_id = ? AND payer_id = ? AND amount_cents = ? AND status = 'pending'
            ''', (payer_id, recipient_id, amount_cents))
            if cursor.fetchone():
                print(f"Skipping duplicate pending request for {recipient_name}")
                continue

            # Payer in the request is the recipient (who owes the money)
            # Requester is the current user (payer_id)
            cursor.execute('''
                INSERT INTO pending_requests (requester_id, payer_id, amount_cents) 
                VALUES (?, ?, ?)
            ''', (payer_id, recipient_id, amount_cents))
            new_request_count += 1
            
            # Send notification to the recipient/payer
            token = get_user_token(recipient_id)
            send_push(token, 'Bill Split Request', f'{payer_name} requested €{amount_cents/100:.2f} from you to split a bill.')

        conn.commit()
        conn.close()
        
        if new_request_count == 0:
            return jsonify({'message': 'No new split requests were created (possible duplicates).', 'total_cents': total_cents})

        return jsonify({'message': f'Split request created: {new_request_count} payment requests sent.', 'total_cents': total_cents})
    except Exception as e:
        print(f"Split request error: {e}")
        return jsonify({'error': str(e)}), 500

# --- NEW: Group Endpoints ---

@app.route('/groups', methods=['GET'])
def get_groups():
    try:
        user_id = request.args.get('creator_id', type=int) 
        
        user_id = request.args.get('user_id', type=int) or request.args.get('creator_id', type=int)

        if not user_id:
            return jsonify({'error': 'user_id or creator_id is required'}), 400

        conn = db_connect()
        cursor = conn.cursor()        
        cursor.execute('''
            SELECT id, name, creator_id, member_ids FROM groups
            ORDER BY created_at DESC
        ''')
        
        groups_list = []
        for id, name, creator_id, member_ids_json in cursor.fetchall():
            try:
                member_ids = json.loads(member_ids_json)
            except json.JSONDecodeError:
                member_ids = []

            if creator_id == user_id or user_id in member_ids:
                groups_list.append({
                    'id': id,
                    'name': name,
                    'creator_id': creator_id,
                    'member_ids': member_ids
                })
            
        conn.close()
        return jsonify(groups_list)
    except Exception as e:
        print(f"Fetch groups error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/groups', methods=['POST'])
def create_group():
    try:
        data = request.get_json()
        creator_id = data['creator_id']
        name = data['name']
        # member_ids is expected to be a list of user IDs
        member_ids_list = data['member_ids'] 
        
        if not name or not member_ids_list:
            return jsonify({'error': 'Group name and members are required'}), 400

        # Validate that member_ids is a list
        if not isinstance(member_ids_list, list):
            return jsonify({'error': 'member_ids must be a list of user IDs'}), 400

        # Serialize the list of member IDs to a JSON string for storage
        member_ids_json = json.dumps(member_ids_list)

        conn = db_connect()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO groups (name, creator_id, member_ids) 
            VALUES (?, ?, ?)
        ''', (name, creator_id, member_ids_json))
        group_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Group created successfully', 
            'id': group_id,
            'name': name,
            'member_ids': member_ids_list
        }), 201

    except Exception as e:
        print(f"Create group error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
