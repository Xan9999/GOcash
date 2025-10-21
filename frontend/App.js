import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Replace with your computer's IP for phone testing (e.g., 'http://192.168.1.100:5000')
  const API_BASE = 'http://192.168.0.109:5000';  // Change this for phone!

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setUsers(data);
      setMessage('');
    } catch (error) {
      setMessage('Error fetching users! Check backend & IP.');
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleAddMoney = async (iban) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/add_money/${iban}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to add money');
      const data = await response.json();
      setMessage(`Added $10! New balance for ${data.iban}: $${data.new_balance.toFixed(2)}`);
      fetchUsers();  // Refresh list
    } catch (error) {
      setMessage('Error adding money.');
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => handleAddMoney(item.iban)}
      activeOpacity={0.7}
    >
      <View style={styles.cell}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.label}>{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#61dafb" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment App - Contacts</Text>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchUsers();
          setRefreshing(false);
        }}
        style={styles.list}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#282c34',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  row: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    minWidth: 100,
    marginRight: 10,
  },
  name: {
    fontWeight: 'bold',
    color: '#000000ff',
    fontSize: 24,
  },
  label: {
    fontWeight: 'bold',
    color: '#838383ff',
    fontSize: 15,
  },
  balance: {
    fontWeight: 'bold',
    color: '#61dafb',
  },
  actionCell: {
    alignItems: 'flex-end',
  },
  actionText: {
    color: '#61dafb',
    fontWeight: 'bold',
  },
  message: {
    color: '#61dafb',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    padding: 10,
  },
});
