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
  TextInput,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');  // 'home', 'contacts', 'transfer', 'requests'
  const [selectedRecipient, setSelectedRecipient] = useState(null);  // For transfer/request
  const [isRequestFlow, setIsRequestFlow] = useState(false);  // Send vs Request mode
  const [pendingRequests, setPendingRequests] = useState([]);  // For requests screen
  const [amountInput, setAmountInput] = useState('10');  // Amount input, default 10

  // Auto-fetch projectId from app.json
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  console.log('Project ID:', projectId);  // Debug
  const API_BASE = 'http://192.168.0.109:5000';

  // Notification handler (skip on web)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    console.log('Setting up notification listener');
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const body = notification.request.content.body;
      console.log('Notification received:', body);
      Alert.alert('Notification', body);
      // New: Refresh pending requests after notification (for foreground updates)
      if (currentUser) {
        await fetchPendingRequests();
      }
    });
    return () => subscription?.remove();
  }, [currentUser]);  // Depend on currentUser to re-subscribe if user changes
  
  // --- Polling + visibility/focus refresh for web to keep pending requests up-to-date ---
  useEffect(() => {
    // Only enable on web (mobile uses push notifications)
    if (Platform.OS !== 'web') return;
    if (!currentUser) return;

    console.log('Starting web polling & visibility handlers for pending requests');

    // Immediately fetch once when effect runs
    fetchPendingRequests();

    // Poll every 10 seconds
    const POLL_MS = 10000;
    const intervalId = setInterval(() => {
      fetchPendingRequests();
    }, POLL_MS);

    // Refresh when tab becomes visible (user returns to tab)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible — refresh pending requests');
        fetchPendingRequests();
      }
    };

    // Refresh when window gains focus
    const onFocus = () => {
      console.log('Window focus — refresh pending requests');
      fetchPendingRequests();
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      console.log('Stopping web polling & visibility handlers');
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser]); // re-run when login changes

  const fetchUsers = async () => {
    console.log('Fetching users...');
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      setUsers(data);
      console.log('Users fetched:', data.length);
      setMessage('');
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage('Error fetching users! Check backend & IP.');
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const fetchPendingRequests = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE}/pending_requests?user_id=${currentUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setPendingRequests(data);
      console.log('Pending requests updated:', data.length);
    } catch (error) {
      console.error('Requests fetch error:', error);
    }
  };

  const handleLogin = async (user) => {
    console.log('handleLogin called for user:', user.id, user.name);
    setLoading(true);
    try {
      let pushToken = null;
      if (Platform.OS !== 'web') {
        console.log('Mobile: Requesting perms...');
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          if (!projectId) throw new Error('No projectId in app.json. Run "eas init".');
          console.log('Getting token with projectId:', projectId);
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          pushToken = tokenData.data;
          console.log('Token received:', pushToken ? 'Yes' : 'No');
        } else {
          console.log('Perms denied, skipping token');
          Alert.alert('Permission Denied', 'Notifications disabled. Login continues without pushes.');
        }
      } else {
        console.log('Web: Skipping push setup');
      }

      console.log('Sending login POST with token:', pushToken ? 'present' : 'null');
      const response = await fetch(`${API_BASE}/login/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pushToken }),
      });
      const responseText = await response.text();
      console.log('Login response status:', response.status, 'body:', responseText);
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
      console.log('Login success, hiding modal');
      fetchUsers();
      fetchPendingRequests();  // Check for pending on login
    } catch (error) {
      console.error('Full login error:', error);
      Alert.alert('Login Error', error.message);
      setMessage('Login failed—check console.');
    }
    setLoading(false);
  };

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setAmountInput('10');  // Reset amount
    setCurrentScreen('transfer');
    setMessage('');  // Clear message
  };

  const handleConfirmTransfer = async () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive number.');
      return;
    }

    if (!currentUser || !selectedRecipient) return;

    setLoading(true);
    try {
      const endpoint = isRequestFlow ? '/request_money' : '/add_money';
      const body = {
        from_iban: isRequestFlow ? selectedRecipient.iban : currentUser.iban,  // Payer is 'from'
        to_iban: isRequestFlow ? currentUser.iban : selectedRecipient.iban,    // Receiver is 'to'
        amount: amount
      };
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to process transaction');
      const data = await response.json();
      const action = isRequestFlow ? 'requested' : 'sent';
      setMessage(`${action.charAt(0).toUpperCase() + action.slice(1)} $${data.amount} ${isRequestFlow ? 'from' : 'to'} ${selectedRecipient.name}!`);
      fetchUsers();
      fetchPendingRequests();  // Always refresh pending after any transaction
      setCurrentScreen('home');  // Redirect to home
    } catch (error) {
      setMessage('Error processing transaction.');
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleApproveRequest = async (requestId, amount, requesterName) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/approve_request/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Failed to approve');
      const data = await response.json();
      setMessage(`Approved request! Sent $${amount} to ${requesterName}.`);
      fetchPendingRequests();
      fetchUsers();
      setCurrentScreen('home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleDenyRequest = async (requestId, requesterName, amount) => {
    try {
      const response = await fetch(`${API_BASE}/deny_request/${requestId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to deny');
      setMessage(`Denied request from ${requesterName} for $${amount}.`);
      fetchPendingRequests();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Load persisted login
  useEffect(() => {
    const loadUser = async () => {
      if (users.length === 0) return;
      const savedId = await AsyncStorage.getItem('currentUserId');
      console.log('Checking saved login:', savedId);
      if (savedId) {
        const savedUser = users.find(u => u.id === parseInt(savedId));
        if (savedUser) {
          console.log('Restoring login for:', savedUser.name);
          setCurrentUser(savedUser);
          setShowLogin(false);
          fetchUsers();
          fetchPendingRequests();
          return;
        }
      }
    };
    loadUser();
  }, [users.length]);

  // Refresh pending requests when on home screen or user changes
  useEffect(() => {
    if (currentUser && currentScreen === 'home') {
      fetchPendingRequests();
    }
  }, [currentUser, currentScreen]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderLoginUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.loginRow} 
      onPress={() => handleLogin(item)}
      activeOpacity={0.8}
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
        onPress={() => !isSelf && handleSelectRecipient(item)}
        disabled={isSelf}
        activeOpacity={0.7}
      >
        <View style={styles.cell}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.label}>{item.phone}</Text>
        </View>
        <Text style={[styles.actionText, isSelf && styles.disabledText]}>
          {isSelf ? 'You' : isRequestFlow ? 'Request From' : 'Send To'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPendingRequest = ({ item }) => (
    <View style={styles.requestRow}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestRequester}>{item.requester_name}</Text>
        <Text style={styles.requestAmount}>${item.amount}</Text>
        <Text style={styles.requestTime}>{item.created_at}</Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApproveRequest(item.id, item.amount, item.requester_name)}
        >
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => handleDenyRequest(item.id, item.requester_name, item.amount)}
        >
          <Text style={styles.denyText}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

const handleLogout = async () => {
  if (!currentUser) return;
  setLoading(true);
  try {
    // Inform backend to remove push token (so device no longer receives pushes)
    console.log('Logging out user', currentUser.id);
    try {
      await fetch(`${API_BASE}/logout/${currentUser.id}`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Logout request to server failed:', err);
      // continue anyway - local logout still happens
    }

    // Clear persisted login on device
    await AsyncStorage.removeItem('currentUserId');
    setCurrentUser(null);
    setShowLogin(true);
    setCurrentScreen('home');
    setMessage('Logged out.');
  } catch (error) {
    console.error('Logout error:', error);
    Alert.alert('Logout Error', error.message || 'Failed to logout.');
  }
  setLoading(false);
};

// --- HomeScreen: add a Logout button top-right ---
// Replace your existing HomeScreen component with this updated version:

const HomeScreen = () => {
  const hasPending = pendingRequests.length > 0;
  return (
    <View style={styles.homeContainer}>
      {/* Logout button top-right */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.homeTitle}>Welcome, {currentUser?.name}!</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {
            setIsRequestFlow(false);
            setCurrentScreen('contacts');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Send Money</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.receiveButton}
          onPress={() => {
            setIsRequestFlow(true);
            setCurrentScreen('contacts');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Request Money</Text>
        </TouchableOpacity>
      </View>
      {hasPending && (
        <TouchableOpacity
          style={styles.pendingButton}
          onPress={() => setCurrentScreen('requests')}
        >
          <Text style={styles.pendingText}>View {pendingRequests.length} Pending Request{pendingRequests.length > 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

  // Contacts Screen
  const ContactsScreen = () => (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('home')}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Select {isRequestFlow ? 'Payer' : 'Recipient'}</Text>
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
    </View>
  );

  // Transfer/Request Screen
  const TransferScreen = () => (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSelectedRecipient(null);
          setCurrentScreen('contacts');
        }}
      >
        <Text style={styles.backText}>← Back to Contacts</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{isRequestFlow ? `Request from ${selectedRecipient?.name}` : `Send to ${selectedRecipient?.name}`}</Text>
      <View style={styles.recipientInfo}>
        <Text style={styles.recipientName}>{selectedRecipient?.name}</Text>
        <Text style={styles.recipientPhone}>{selectedRecipient?.phone}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount ($):</Text>
        <TextInput
          style={styles.amountInput}
          value={amountInput}
          onChangeText={setAmountInput}
          keyboardType="numeric"
          placeholder="10"
          placeholderTextColor="#999"
          autoFocus={true}
          returnKeyType="done"
          onSubmitEditing={handleConfirmTransfer}
          blurOnSubmit={false}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.confirmButton,
          { backgroundColor: isRequestFlow ? '#4CAF50' : '#61dafb' }
        ]}
        onPress={handleConfirmTransfer}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Text style={styles.confirmButtonText}>{isRequestFlow ? 'Request Money' : 'Confirm Send'}</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );

  // Requests Screen
  const RequestsScreen = () => (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('home')}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Pending Requests</Text>
      <FlatList
        data={pendingRequests}
        renderItem={renderPendingRequest}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending requests.</Text>}
      />
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#61dafb" />
        <Text style={styles.loadingText}>Loading users...</Text>
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

      {!showLogin && currentScreen === 'home' && <HomeScreen />}
      {!showLogin && currentScreen === 'contacts' && <ContactsScreen />}
      {!showLogin && currentScreen === 'transfer' && <TransferScreen />}
      {!showLogin && currentScreen === 'requests' && <RequestsScreen />}
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
  homeContainer: {
    flex: 1,
    backgroundColor: '#282c34',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    marginVertical: 40,
  },
  sendButton: {
    backgroundColor: '#61dafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: 200,
  },
  receiveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    width: 200,
  },
  pendingButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  pendingText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  backText: {
    color: '#61dafb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  recipientInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  recipientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282c34',
    marginBottom: 5,
  },
  recipientPhone: {
    fontSize: 16,
    color: '#666',
  },
  amountContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#282c34',
    marginBottom: 10,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 4,
    fontSize: 18,
    textAlign: 'center',
  },
  confirmButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  requestRow: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestRequester: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#282c34',
  },
  requestAmount: {
    fontSize: 16,
    color: '#4CAF50',
    marginVertical: 5,
  },
  requestTime: {
    fontSize: 14,
    color: '#666',
  },
  requestButtons: {
    flexDirection: 'row',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 4,
    marginLeft: 10,
  },
  denyButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 4,
    marginLeft: 10,
  },
  approveText: {
    color: 'white',
    fontWeight: 'bold',
  },
  denyText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
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
    marginTop: 60,
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
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f44336',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },

});