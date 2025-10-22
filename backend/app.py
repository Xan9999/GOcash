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

    # --- NEW: Transactions Table ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            initiator_id INTEGER NOT NULL,
            target_id INTEGER,
            amount_cents INTEGER,
            status TEXT DEFAULT 'pending',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            memo TEXT,
            request_ref INTEGER,
            FOREIGN KEY (initiator_id) REFERENCES users (id),
            FOREIGN KEY (target_id) REFERENCES users (id),
            FOREIGN KEY (request_ref) REFERENCES pending_requests (id)
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
            ("Ana Novak", "ana.novak@gmail.com", "+386 40 123 456", "SI56123456780000123"),
            ("Marko Kovač", "marko.kovac@yahoo.com", "+386 31 987 654", "SI56123456780000234"),
            ("Petra Zupan", "petra.zupan@outlook.com", "+386 41 555 111", "SI56123456780000345"),
            ("Tomaž Horvat", "tomaz.horvat@gmail.com", "+386 40 222 333", "SI56123456780000456"),
            ("Nina Mlakar", "nina.mlakar@hotmail.com", "+386 31 444 555", "SI56123456780000567"),
            ("Luka Kralj", "luka.kralj@gmail.com", "+386 40 666 777", "SI56123456780000678"),
            ("Maja Rozman", "maja.rozman@yahoo.com", "+386 41 888 999", "SI56123456780000789"),
            ("Jan Potočnik", "jan.potocnik@gmail.com", "+386 31 123 789", "SI56123456780000890"),
            ("Sara Bizjak", "sara.bizjak@gmail.com", "+386 40 234 567", "SI56123456780000901"),
            ("Žan Kastelic", "zan.kastelic@outlook.com", "+386 41 345 678", "SI56123456780001012"),
            ("Katarina Koren", "katarina.koren@gmail.com", "+386 31 456 789", "SI56123456780001123"),
            ("Miha Medved", "miha.medved@yahoo.com", "+386 40 567 890", "SI56123456780001234"),
            ("Tjaša Vidmar", "tjasa.vidmar@gmail.com", "+386 31 678 901", "SI56123456780001345"),
            ("Rok Zajc", "rok.zajc@gmail.com", "+386 41 789 012", "SI56123456780001456"),
            ("Eva Kos", "eva.kos@hotmail.com", "+386 40 890 123", "SI56123456780001567"),
            ("Nejc Kosi", "nejc.kosi@gmail.com", "+386 31 901 234", "SI56123456780001678"),
            ("Tina Lesjak", "tina.lesjak@yahoo.com", "+386 40 012 345", "SI56123456780001789"),
            ("Gregor Hrovat", "gregor.hrovat@gmail.com", "+386 41 111 222", "SI56123456780001890"),
            ("Barbara Turk", "barbara.turk@outlook.com", "+386 31 222 333", "SI56123456780001901"),
            ("David Dolinar", "david.dolinar@gmail.com", "+386 40 333 444", "SI56123456780002012"),
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
        
        # Seed transaction rows for the seeded pending request
        # request_sent: from requester (Bob id=2) to payer (Alice id=1)
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, request_ref)
            VALUES ('request_sent', ?, ?, ?, 'pending', last_insert_rowid())
        ''', (2, 1, 500))
        # request_received: from payer (Alice id=1) to requester (Bob id=2)
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, request_ref)
            VALUES ('request_received', ?, ?, ?, 'pending', (SELECT id FROM pending_requests WHERE id = last_insert_rowid()))
        ''', (1, 2, 500))
        
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
        cursor.execute('DELETE FROM push_tokens WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Logout successful'})
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/request_money', methods=['POST'])
def request_money():
    try:
        data = request.get_json()
        requester_iban = data['requester_iban']
        payer_iban = data['payer_iban']
        amount_cents = int(data['amount_cents'])
        memo = data.get('memo', '')

        if amount_cents <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        conn = db_connect()
        cursor = conn.cursor()

        # Get IDs
        cursor.execute('SELECT id FROM users WHERE iban = ?', (requester_iban,))
        requester_id = cursor.fetchone()[0]
        cursor.execute('SELECT id, name FROM users WHERE iban = ?', (payer_iban,))
        payer_data = cursor.fetchone()
        if not payer_data:
            conn.close()
            return jsonify({'error': 'Payer not found'}), 404
        payer_id, payer_name = payer_data

        # Check for existing request to prevent duplicates
        cursor.execute('''
            SELECT id FROM pending_requests 
            WHERE requester_id = ? AND payer_id = ? AND amount_cents = ? AND status = 'pending'
        ''', (requester_id, payer_id, amount_cents))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Duplicate pending request exists'}), 409

        # Insert pending request
        cursor.execute('''
            INSERT INTO pending_requests (requester_id, payer_id, amount_cents) 
            VALUES (?, ?, ?)
        ''', (requester_id, payer_id, amount_cents))
        request_id = cursor.lastrowid

        # Insert transaction logs
        # request_sent from requester's perspective
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, memo, request_ref)
            VALUES ('request_sent', ?, ?, ?, 'pending', ?, ?)
        ''', (requester_id, payer_id, amount_cents, memo, request_id))
        # request_received from payer's perspective
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, memo, request_ref)
            VALUES ('request_received', ?, ?, ?, 'pending', ?, ?)
        ''', (payer_id, requester_id, amount_cents, memo, request_id))

        conn.commit()

        # Notify payer
        token = get_user_token(payer_id)
        send_push(token, 'Money Request', f'{data.get("requester_name", "Someone")} requests €{amount_cents/100:.2f} from you.')

        conn.close()
        return jsonify({'message': 'Request sent', 'request_id': request_id, 'amount_cents': amount_cents})
    except Exception as e:
        print(f"Request error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/transfer_money', methods=['POST'])
def transfer_money():
    try:
        data = request.get_json()
        sender_iban = data['sender_iban']
        receiver_iban = data['receiver_iban']
        amount_cents = int(data['amount_cents'])
        memo = data.get('memo', '')

        if amount_cents <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        conn = db_connect()
        cursor = conn.cursor()

        # Get IDs and names
        cursor.execute('SELECT id, name FROM users WHERE iban = ?', (sender_iban,))
        sender_data = cursor.fetchone()
        if not sender_data:
            conn.close()
            return jsonify({'error': 'Sender not found'}), 404
        sender_id, sender_name = sender_data

        cursor.execute('SELECT id, name FROM users WHERE iban = ?', (receiver_iban,))
        receiver_data = cursor.fetchone()
        if not receiver_data:
            conn.close()
            return jsonify({'error': 'Receiver not found'}), 404
        receiver_id, receiver_name = receiver_data

        # Check sender balance
        cursor.execute('SELECT balance_cents FROM bank_balances WHERE iban = ?', (sender_iban,))
        balance = cursor.fetchone()[0]
        if balance < amount_cents:
            conn.close()
            return jsonify({'error': 'Insufficient balance'}), 400

        # Transfer funds
        cursor.execute('UPDATE bank_balances SET balance_cents = balance_cents - ? WHERE iban = ?', (amount_cents, sender_iban))
        cursor.execute('UPDATE bank_balances SET balance_cents = balance_cents + ? WHERE iban = ?', (amount_cents, receiver_iban))

        # Insert transaction logs (sent from sender, received from receiver)
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, memo)
            VALUES ('transfer', ?, ?, ?, 'completed', ?)
        ''', (sender_id, receiver_id, amount_cents, memo))
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, memo)
            VALUES ('transfer', ?, ?, ?, 'completed', ?)
        ''', (receiver_id, sender_id, amount_cents, memo))

        conn.commit()

        # Notify receiver
        token = get_user_token(receiver_id)
        send_push(token, 'Money Received', f'{sender_name} sent you €{amount_cents/100:.2f}.')

        conn.close()
        return jsonify({'message': 'Transfer successful', 'amount_cents': amount_cents})
    except Exception as e:
        print(f"Transfer error: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/pending_requests', methods=['GET'])
def pending_requests():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id required'}), 400

        conn = db_connect()
        cursor = conn.cursor()
        # Fetch requests where user is payer (to approve/deny)
        cursor.execute('''
            SELECT pr.id, pr.requester_id, u.name as requester_name, pr.amount_cents, pr.status, pr.created_at
            FROM pending_requests pr
            JOIN users u ON pr.requester_id = u.id
            WHERE pr.payer_id = ? AND pr.status = 'pending'
            ORDER BY pr.created_at DESC
        ''', (user_id,))
        requests_data = cursor.fetchall()

        requests_list = []
        for id, requester_id, requester_name, amount_cents, status, created_at in requests_data:
            requests_list.append({
                'id': id,
                'requester_id': requester_id,
                'requester_name': requester_name,
                'amount': amount_cents / 100.0,
                'status': status,
                'created_at': created_at
            })

        conn.close()
        return jsonify(requests_list)
    except Exception as e:
        print(f"Pending requests error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/approve_request/<int:request_id>', methods=['POST'])
def approve_request(request_id):
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

        # Fetch names
        cursor.execute('SELECT name FROM users WHERE id = ?', (payer_id,))
        payer_name_data = cursor.fetchone()
        payer_name = payer_name_data[0] if payer_name_data else "Unknown"
        cursor.execute('SELECT name FROM users WHERE id = ?', (requester_id,))
        requester_name_data = cursor.fetchone()
        requester_name = requester_name_data[0] if requester_name_data else "Unknown"

        # Update request status
        cursor.execute('UPDATE pending_requests SET status = "approved" WHERE id = ?', (request_id,))
        
        # Transfer funds (debit payer, credit requester)
        cursor.execute('UPDATE bank_balances SET balance_cents = balance_cents - ? WHERE iban = (SELECT iban FROM users WHERE id = ?)', (amount_cents, payer_id))
        cursor.execute('UPDATE bank_balances SET balance_cents = balance_cents + ? WHERE iban = (SELECT iban FROM users WHERE id = ?)', (amount_cents, requester_id))
        
        # Insert approved transaction log (single row for the approval/transfer)
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, request_ref)
            VALUES ('request_approved', ?, ?, ?, 'completed', ?)
        ''', (payer_id, requester_id, amount_cents, request_id))

        # Update the original request transaction logs status
        cursor.execute('''
            UPDATE transactions SET status = 'completed' WHERE request_ref = ? AND status = 'pending'
        ''', (request_id,))

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

        # Update request status
        cursor.execute('UPDATE pending_requests SET status = "denied" WHERE id = ?', (request_id,))
        
        # Insert denied transaction log
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, request_ref)
            VALUES ('request_denied', ?, ?, ?, 'rejected', ?)
        ''', (payer_id, requester_id, amount_cents, request_id))

        # Update the original request transaction logs status
        cursor.execute('''
            UPDATE transactions SET status = 'rejected' WHERE request_ref = ? AND status = 'pending'
        ''', (request_id,))
        
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
        
        # Insert split_sent transaction log
        memo = f"Razdeli račun €{total_cents / 100:.2f}"
        cursor.execute('''
            INSERT INTO transactions (type, initiator_id, amount_cents, status, memo)
            VALUES ('split_sent', ?, ?, 'completed', ?)
        ''', (payer_id, total_cents, memo))

        split_sent_id = cursor.lastrowid

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

            # Insert pending request
            cursor.execute('''
                INSERT INTO pending_requests (requester_id, payer_id, amount_cents) 
                VALUES (?, ?, ?)
            ''', (payer_id, recipient_id, amount_cents))
            request_id = cursor.lastrowid
            new_request_count += 1
            
            # Insert transaction logs for this sub-request
            memo = data.get('memo', '')  # Shared memo for split
            # request_sent
            cursor.execute('''
                INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, memo, request_ref)
                VALUES ('request_sent', ?, ?, ?, 'pending', ?, ?)
            ''', (payer_id, recipient_id, amount_cents, memo, request_id))
            # request_received
            cursor.execute('''
                INSERT INTO transactions (type, initiator_id, target_id, amount_cents, status, memo, request_ref)
                VALUES ('request_received', ?, ?, ?, 'pending', ?, ?)
            ''', (recipient_id, payer_id, amount_cents, memo, request_id))
            
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
        user_id = request.args.get('user_id', type=int) 

        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        conn = db_connect()
        cursor = conn.cursor()
        
        cursor.execute(
            f'''
            SELECT 
                g.id, 
                g.name, 
                g.creator_id, 
                g.member_ids,
                g.created_at  -- *** ADDED ***
            FROM groups g
            WHERE g.creator_id = ? 
            
            UNION 
            
            SELECT 
                g.id, 
                g.name, 
                g.creator_id, 
                g.member_ids,
                g.created_at  -- *** ADDED ***
            FROM groups g, json_each(g.member_ids)
            WHERE json_each.value = ? 
            
            ORDER BY created_at DESC; -- This now correctly refers to the selected column
            ''', (user_id, user_id)
        )
        
        groups_list = []
        for id, name, creator_id, member_ids_json, _ in cursor.fetchall(): 
            try:
                member_ids = json.loads(member_ids_json)
            except json.JSONDecodeError:
                member_ids = []
            
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

# --- NEW: Transactions Endpoint ---
@app.route('/transactions', methods=['GET'])
def get_transactions():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        conn = db_connect()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                t.id, t.type, t.initiator_id, t.target_id, t.amount_cents, 
                t.status, t.timestamp, t.memo, t.request_ref,
                u1.name as initiator_name, u2.name as target_name
            FROM transactions t
            LEFT JOIN users u1 ON t.initiator_id = u1.id
            LEFT JOIN users u2 ON t.target_id = u2.id
            WHERE t.initiator_id = ? OR t.target_id = ?
            ORDER BY t.timestamp DESC
        ''', (user_id, user_id))
        
        transactions_list = []
        for row in cursor.fetchall():
            transactions_list.append({
                'id': row[0],
                'type': row[1],
                'initiator_id': row[2],
                'target_id': row[3],
                'amount': row[4] / 100.0 if row[4] is not None else None,
                'status': row[5],
                'timestamp': row[6],
                'memo': row[7],
                'initiator_name': row[9],
                'target_name': row[10]
            })
        
        conn.close()
        return jsonify(transactions_list)
    except Exception as e:
        print(f"Fetch transactions error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)