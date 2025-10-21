import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddEntry = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/add_entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setMessage(`Entry added! ID: ${data.id}, Timestamp: ${data.timestamp}`);
    } catch (error) {
      setMessage('Error adding entry. Make sure backend is running.');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Basic React + Python App</h1>
        <button onClick={handleAddEntry} disabled={loading}>
          {loading ? 'Adding...' : 'Add Entry to DB'}
        </button>
        {message && <p>{message}</p>}
      </header>
    </div>
  );
}

export default App;
