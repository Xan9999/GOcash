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
            ('Ana Novak', 'ana.novak@example.si', '+386-40-123-456', 'ANA1234567890'),
            ('Bojan Kovač', 'bojan.kovac@example.si', '+386-41-234-567', 'BOJAN1234567891'),
            ('Cvetka Zupan', 'cvetka.zupan@example.si', '+386-31-345-678', 'CVETKA1234567892'),
            ('David Horvat', 'david.horvat@example.si', '+386-51-456-789', 'DAVID1234567893'),
            ('Eva Mlakar', 'eva.mlakar@example.si', '+386-30-567-890', 'EVA1234567894'),
            ('Franc Potočnik', 'franc.potocnik@example.si', '+386-41-678-901', 'FRANC1234567895'),
            ('Gabrijela Zajc', 'gabrijela.zajc@example.si', '+386-40-789-012', 'GABRIJELA1234567896'),
            ('Herman Kralj', 'herman.kralj@example.si', '+386-31-890-123', 'HERMAN1234567897'),
            ('Irena Vovk', 'irena.vovk@example.si', '+386-51-901-234', 'IRENA1234567898'),
            ('Jure Bizjak', 'jure.bizjak@example.si', '+386-30-012-345', 'JURE1234567899')
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
        'id': row[0], 'name': row[1], 'email': row[2], 'phone': row[3],
        'iban': row[4], 'balance': row[5]
    } for row in users])

@app.route('/add_money/<iban>', methods=['POST'])
def add_money(iban):
    try:
        conn = sqlite3.connect('payments.db')
        cursor = conn.cursor()
        
        # Get current balance (or 0 if none)
        cursor.execute('SELECT balance FROM bank_balances WHERE iban = ?', (iban,))
        result = cursor.fetchone()
        
        if result is None:
            new_balance = 10.0
            cursor.execute('INSERT INTO bank_balances (iban, balance) VALUES (?, ?)', (iban, new_balance))
        else:
            new_balance = result[0] + 10.0
            cursor.execute('UPDATE bank_balances SET balance = ? WHERE iban = ?', (new_balance, iban))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Added 10 to balance', 'iban': iban, 'new_balance': new_balance})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')  # Added host='0.0.0.0' for external access
