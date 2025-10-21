import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/users');
      const data = await response.json();
      setUsers(data);
      setMessage('');
    } catch (error) {
      setMessage('Error fetching users. Make sure backend is running.');
    }
    setLoading(false);
  };

  const handleAddMoney = async (iban) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/add_money/${iban}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setMessage(`Added 10! New balance for ${data.iban}: $${data.new_balance.toFixed(2)}`);
      fetchUsers();  // Refresh list
    } catch (error) {
      setMessage('Error adding money.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="App">Loading...</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Payment App - Contacts</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} onClick={() => handleAddMoney(user.iban)} className="clickable-row">
                <td>{user.name}</td>
                <td>{user.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {message && <p>{message}</p>}
        <button onClick={fetchUsers} disabled={loading}>Refresh</button>
      </header>
    </div>
  );
}

export default App;
