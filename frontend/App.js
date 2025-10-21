import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';  // Ensures projectId auto-load

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Auto-fetch projectId from app.json
  const projectId = Constants?.expoConfig?.projectId;
  console.log('Project ID:', projectId);  // Debug: Should log your ID
  const API_BASE = 'http://192.168.0.115:5000';
  // const API_BASE = 'http://192.168.0.109:5000'; 

  // Notification handler (skip on web)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    console.log('Setting up notification listener');  // Debug
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      Alert.alert('Notification', notification.request.content.body);
    });
    return () => subscription?.remove();
  }, []);

  const fetchUsers = async () => {
    console.log('Fetching users...');  // Debug
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      setUsers(data);
      console.log('Users fetched:', data.length);  // Debug
      setMessage('');
    } catch (error) {
      console.error('Fetch error:', error);  // Debug
      setMessage('Error fetching users! Check backend & IP.');
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleLogin = async (user) => {
    console.log('handleLogin called for user:', user.id, user.name);  // KEY DEBUG: Does this fire on tap?
    setLoading(true);
    try {
      let pushToken = null;
      if (Platform.OS !== 'web') {
        console.log('Mobile: Requesting perms...');  // Debug
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          if (!projectId) throw new Error('No projectId in app.json. Run "eas init".');
          console.log('Getting token with projectId:', projectId);  // Debug
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          pushToken = tokenData.data;
          console.log('Token received:', pushToken ? 'Yes' : 'No');  // Debug
        } else {
          console.log('Perms denied, skipping token');  // Debug
          Alert.alert('Permission Denied', 'Notifications disabled. Login continues without pushes.');
        }
      } else {
        console.log('Web: Skipping push setup');  // Debug
      }

      console.log('Sending login POST with token:', pushToken ? 'present' : 'null');  // Debug
      const response = await fetch(`${API_BASE}/login/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pushToken }),
      });
      const responseText = await response.text();
      console.log('Login response status:', response.status, 'body:', responseText);  // Debug
      if (!response.ok) {
        let errorMsg = `Login failed: HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg += ` - ${errorJson.errors?.[0]?.message || errorJson.error || 'Unknown'}`;
        } catch {}
        throw new Error(errorMsg);
      }

      await AsyncStorage.setItem('currentUserId', user.id.toString());
      setCurrentUser(user);
      setShowLogin(false);
      setMessage(`Logged in as ${user.name}${Platform.OS === 'web' ? ' (Web: No notifications)' : ''}`);
      console.log('Login success, hiding modal');  // Debug
      fetchUsers();
    } catch (error) {
      console.error('Full login error:', error);  // Debug
      Alert.alert('Login Error', error.message);
      setMessage('Login failed—check console.');
    }
    setLoading(false);
  };

  const handleAddMoney = async (iban) => {
    if (!currentUser) return;

    const targetUser = users.find(u => u.iban === iban);
    if (targetUser.id === currentUser.id) {
      Alert.alert('Self-Send', 'Cannot send to yourself.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/add_money/${iban}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to add money');
      const data = await response.json();
      setMessage(`Sent $10 to ${targetUser.name}! Their new balance: $${data.new_balance.toFixed(2)}`);
      fetchUsers();
    } catch (error) {
      setMessage('Error sending money.');
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  // Load persisted login (after users load)
  useEffect(() => {
    const loadUser = async () => {
      if (users.length === 0) return;  // Wait for users
      const savedId = await AsyncStorage.getItem('currentUserId');
      console.log('Checking saved login:', savedId);  // Debug
      if (savedId) {
        const savedUser = users.find(u => u.id === parseInt(savedId));
        if (savedUser) {
          console.log('Restoring login for:', savedUser.name);  // Debug
          setCurrentUser(savedUser);
          setShowLogin(false);
          fetchUsers();
          return;
        }
      }
    };
    loadUser();
  }, [users.length]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderLoginUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.loginRow} 
      onPress={() => handleLogin(item)}
      activeOpacity={0.8}  // Visual feedback on tap
    >
      <Text style={styles.loginName}>{item.name}</Text>
      <Text style={styles.loginDetail}>{item.email}</Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => {
    const isSelf = item.id === currentUser?.id;
    return (
      <TouchableOpacity
        style={[styles.row, isSelf && styles.disabledRow]}
        onPress={() => !isSelf && handleAddMoney(item.iban)}
        disabled={isSelf}
        activeOpacity={0.7}
      >
        <View style={styles.cell}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.label}>{item.phone}</Text>
        </View>
        <Text style={[styles.actionText, isSelf && styles.disabledText]}>
          {isSelf ? 'You' : 'Send $10'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#61dafb" />
        <Text style={styles.loadingText}>Loading users...</Text>  {/* Better UX */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal visible={showLogin} animationType="slide">
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Login to Payment App</Text>
          <Text style={styles.subtitle}>Select your account:</Text>
          <FlatList
            data={users}
            renderItem={renderLoginUser}
            keyExtractor={(item) => item.id.toString()}
            style={styles.loginList}
          />
          {loading && <ActivityIndicator size="small" color="#61dafb" style={styles.loadingSpinner} />}
        </View>
      </Modal>

      {!showLogin && (
        <>
          <Text style={styles.title}>Contacts - Logged in as {currentUser?.name}</Text>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#282c34',
    padding: 20,
  },
  loginContainer: {
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
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginList: {
    flex: 1,
  },
  loginRow: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
  },
  loginName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginDetail: {
    color: '#666',
    fontSize: 14,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledRow: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  cell: {
    flex: 1,
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
  actionText: {
    color: '#61dafb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledText: {
    color: '#999',
  },
  message: {
    color: '#61dafb',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    padding: 10,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingSpinner: {
    marginTop: 10,
  },
});