import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ImageBackground,
  TouchableOpacity,
  ScrollView, 
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// --- Import Components and Styles ---
import styles from './Styles';
import HomeScreen from './Components/HomeScreen';
import ContactsScreen from './Components/ContactsScreen';
import SplitSelectionScreen from './Components/SplitSelectionScreen';
import TransferScreen from './Components/TransferScreen';
import RequestsScreen from './Components/RequestsScreen';
import SplitConfirmScreen from './Components/SplitConfirmScreen';
import { renderLoginUser } from './Components/Renderers';

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'contacts', 'transfer', 'requests', 'split', 'split_confirm'
  const [selectedRecipient, setSelectedRecipient] = useState(null); // For transfer/request
  const [isRequestFlow, setIsRequestFlow] = useState(false); // Send vs Request mode
  const [pendingRequests, setPendingRequests] = useState([]); // For requests screen
  const [amountInput, setAmountInput] = useState('10'); // Amount input, default 10

  // For split
  const [splitSelectedIds, setSplitSelectedIds] = useState([]); // array of user ids selected
  const [splitAmountInput, setSplitAmountInput] = useState('30'); // total bill in euros
  const [shares, setShares] = useState([]); // Array of % (0-100) for each selected user, index matches splitSelectedIds
  const [userSharePercent, setUserSharePercent] = useState(100);

  // Auto-fetch projectId from app.json
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const API_BASE = 'http://192.168.0.109:5000'; // Keep this here as it's logic/config

  // Notification setup (mobile only, with token registration after login)
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Web platform detected: Skipping notification setup.');
      return;
    }

    console.log('Setting up notification listener on mobile...');
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const body = notification.request.content.body;
      console.log('Notification received:', body);
      Alert.alert('Notification', body);
      // Refresh pending requests after notification (for foreground updates)
      if (currentUser) {
        await fetchPendingRequests();
      }
    });
    return () => subscription?.remove();
  }, [currentUser]);

  // Separate effect for token registration after login
  useEffect(() => {
    if (Platform.OS === 'web' || !currentUser || !projectId) return;

    const registerToken = async () => {
      console.log('Registering push token for user:', currentUser.id);
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permissions not granted, skipping token registration');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const pushToken = tokenData.data;
        console.log('Push token for registration:', pushToken ? 'Fetched' : 'Failed');

        if (pushToken) {
          const response = await fetch(`${API_BASE}/login/${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pushToken }),
          });
          console.log('Token registration response:', response.status);
        }
      } catch (error) {
        console.error('Token registration error:', error);
      }
    };

    registerToken();
  }, [currentUser, projectId]);

  // --- API Handlers (Keep in App.js as they manage main state) ---
  const fetchUsers = async () => {
    console.log('Fetching users...');
    setRefreshing(true);
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
    setRefreshing(false);
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
      // Token handled in separate useEffect now
      console.log('Sending login POST (token handled separately)');
      const response = await fetch(`${API_BASE}/login/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pushToken: null }), // Token sent later if available
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
      fetchPendingRequests(); // Check for pending on login
    } catch (error) {
      console.error('Full login error:', error);
      Alert.alert('Login Error', error.message);
      setMessage('Login failed—check console.');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      console.log('Logging out user', currentUser.id);
      try {
        await fetch(`${API_BASE}/logout/${currentUser.id}`, { method: 'POST' });
      } catch (err) {
        console.warn('Logout request to server failed:', err);
      }
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

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setAmountInput('10'); // Reset amount
    setCurrentScreen('transfer');
    setMessage(''); // Clear message
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
      // convert euros to cents integer
      const amount_cents = Math.round(amount * 100);
      const endpoint = isRequestFlow ? '/request_money' : '/add_money';
      const body = isRequestFlow ? {
        from_iban: selectedRecipient.iban,
        to_iban: currentUser.iban,
        amount_cents
      } : {
        from_iban: currentUser.iban,
        to_iban: selectedRecipient.iban,
        amount_cents
      };
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to process transaction');
      const data = await response.json();
      const action = isRequestFlow ? 'requested' : 'sent';
      setMessage(`${action.charAt(0).toUpperCase() + action.slice(1)} €${(data.amount_cents/100).toFixed(2)} ${isRequestFlow ? 'from' : 'to'} ${selectedRecipient.name}!`);
      fetchUsers();
      fetchPendingRequests();
      setSelectedRecipient(null); // Clear selected recipient
      setCurrentScreen('home');
    } catch (error) {
      setMessage('Error processing transaction.');
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleApproveRequest = async (requestId, amount_cents, requesterName) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/approve_request/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_cents }),
      });
      if (!response.ok) throw new Error('Failed to approve');
      const data = await response.json();
      setMessage(`Approved request! Sent €${(amount_cents/100).toFixed(2)} to ${requesterName}.`);
      fetchPendingRequests(); // Refresh list to remove the approved one
      fetchUsers(); // Update balances
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleDenyRequest = async (requestId, requesterName, amount_cents) => {
    try {
      const response = await fetch(`${API_BASE}/deny_request/${requestId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to deny');
      setMessage(`Denied request from ${requesterName} for €${(amount_cents/100).toFixed(2)}.`);
      fetchPendingRequests();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // --- Split Handlers ---
  const toggleSplitSelect = (userId) => {
    setSplitSelectedIds(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId);
      return [...prev, userId];
    });
  };

  const handleConfirmSelection = () => {
    if (splitSelectedIds.length === 0) {
      Alert.alert('Select people', 'Please select at least one person to split with.');
      return;
    }
    const numOthers = splitSelectedIds.length;
    const equalPercent = 100 / (numOthers + 1); // Include user for equal
    setShares(Array(numOthers).fill(equalPercent));
    setUserSharePercent(equalPercent); // User also equal
    setSplitAmountInput('30');
    setCurrentScreen('split_confirm');
    setMessage('');
  };

  const handleUserShareChange = (newPercent) => {
    setUserSharePercent(Math.max(0, Math.min(100, newPercent)));
  };

  const handleOtherShareChange = (index, newPercent) => {
    const newShares = [...shares];
    newShares[index] = Math.max(0, Math.min(100, newPercent));
    setShares(newShares);
  };

  const equalizeShares = () => {
    if (splitSelectedIds.length === 0) return;
    const numTotal = splitSelectedIds.length + 1; // + user
    const equalPercent = 100 / numTotal;
    setShares(Array(splitSelectedIds.length).fill(equalPercent));
    setUserSharePercent(equalPercent);
  };

  const memoizedAmounts = useMemo(() => {
    const total = parseFloat(splitAmountInput) || 0;
    const userAmount = (userSharePercent / 100) * total;
    const otherAmounts = splitSelectedIds.map((id, idx) => {
      const percent = shares[idx] || 0;
      return (percent / 100) * total;
    });
    return { user: userAmount, others: otherAmounts };
  }, [splitSelectedIds, shares, splitAmountInput, userSharePercent]);
  
  const handleConfirmSplit = async () => {
    if (!currentUser) {
      Alert.alert('Not logged in');
      return;
    }
    const total = parseFloat(splitAmountInput);
    if (isNaN(total) || total <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive amount for the bill.');
      return;
    }

    // Normalize all shares (user + others) to 100%
    const allPercents = [userSharePercent, ...shares];
    const totalPercent = allPercents.reduce((sum, p) => sum + p, 0);
    const normalizedAll = allPercents.map(p => totalPercent > 0 ? (p / totalPercent) * 100 : 0);

    // User share (first) - but since payer, their % is for net calc
    const othersNorm = normalizedAll.slice(1);

    // Amounts for others only (requests to them)
    const total_cents = Math.round(total * 100);
    const recipients = splitSelectedIds.map((uid, idx) => {
      const percent = othersNorm[idx];
      const amount_cents = Math.round((percent / 100) * total_cents);
      return { user_id: uid, amount_cents };
    });

    // Map to IBANs (same as before)
    const recipientsWithIban = recipients.map(r => {
      const u = users.find(x => x.id === r.user_id);
      return { iban: u.iban, name: u.name, amount_cents: r.amount_cents };
    });

    const body = {
      payer_iban: currentUser.iban,
      recipients: recipientsWithIban.map(r => ({ iban: r.iban, amount_cents: r.amount_cents })),
      total_cents
    };

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/split_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Split request failed');
      }
      setMessage(`Split created. Requested ${recipientsWithIban.length} unequal payments totaling €${total.toFixed(2)}.`);
      // Reset
      setSplitSelectedIds([]);
      setShares([]);
      setUserSharePercent(100);
      setSplitAmountInput('30');
      setCurrentScreen('home');
      fetchPendingRequests();
    } catch (error) {
      console.error('Split error:', error);
      Alert.alert('Split Error', error.message || 'Failed to create split');
    }
    setLoading(false);
  };
  // --- End Split Handlers ---

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
      // If we have users but no saved login, still set loading to false to show login modal
      setLoading(false); 
    };
    loadUser();
  }, [users.length]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Refresh pending requests when on home screen or user changes
  useEffect(() => {
    if (currentUser && currentScreen === 'home') {
      fetchPendingRequests();
    }
  }, [currentUser, currentScreen]);

  // Web polling & visibility handlers (from earlier fix)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!currentUser) return;

    console.log('Starting web polling & visibility handlers for pending requests');

    fetchPendingRequests();

    const POLL_MS = 10000;
    const intervalId = setInterval(() => {
      fetchPendingRequests();
    }, POLL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingRequests();
      }
    };
    const onFocus = () => fetchPendingRequests();

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser]);


  // Login Renderer
  const loginRenderer = renderLoginUser(styles, handleLogin);

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#61dafb" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  // --- Main App Renderer and Router ---
  return (
    <ImageBackground
      // You may need to create an empty asset file or replace this with a valid URL if running outside the original project context
      // source={require('./assets/Background.jpg')}
      source={{uri: 'https://placehold.co/1920x1080/282c34/61dafb?text=Payment+App+Background'}}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Modal visible={showLogin} animationType="slide" transparent>
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Login to Payment App</Text>
            <Text style={styles.subtitle}>Select your account:</Text>
            <FlatList
              data={users}
              renderItem={loginRenderer}
              keyExtractor={(item) => item.id.toString()}
              style={styles.loginList}
            />
            {loading && <ActivityIndicator size="small" color="#61dafb" style={styles.loadingSpinner} />}
          </View>
        </Modal>

        {!showLogin && currentScreen === 'home' && (
          <HomeScreen 
            currentUser={currentUser}
            handleLogout={handleLogout}
            pendingRequests={pendingRequests}
            setCurrentScreen={setCurrentScreen}
            setIsRequestFlow={setIsRequestFlow}
            setSplitSelectedIds={setSplitSelectedIds}
            setShares={setShares}
          />
        )}
        {!showLogin && currentScreen === 'contacts' && (
          <ContactsScreen 
            users={users}
            currentUser={currentUser}
            isRequestFlow={isRequestFlow}
            handleSelectRecipient={handleSelectRecipient}
            setCurrentScreen={setCurrentScreen}
            refreshing={refreshing}
            fetchUsers={fetchUsers}
          />
        )}
        {!showLogin && currentScreen === 'transfer' && (
          <TransferScreen 
            selectedRecipient={selectedRecipient}
            isRequestFlow={isRequestFlow}
            amountInput={amountInput}
            setAmountInput={setAmountInput}
            handleConfirmTransfer={handleConfirmTransfer}
            setCurrentScreen={setCurrentScreen}
            setSelectedRecipient={setSelectedRecipient}
            loading={loading}
            message={message}
          />
        )}
        {!showLogin && currentScreen === 'requests' && (
          <RequestsScreen 
            pendingRequests={pendingRequests}
            handleApproveRequest={handleApproveRequest}
            handleDenyRequest={handleDenyRequest}
            setCurrentScreen={setCurrentScreen}
          />
        )}
        {!showLogin && currentScreen === 'split' && (
          <SplitSelectionScreen
            users={users}
            currentUser={currentUser}
            splitSelectedIds={splitSelectedIds}
            toggleSplitSelect={toggleSplitSelect}
            handleConfirmSelection={handleConfirmSelection}
            setCurrentScreen={setCurrentScreen}
            setSplitSelectedIds={setSplitSelectedIds}
            setShares={setShares}
            setUserSharePercent={setUserSharePercent}
            loading={loading}
          />
        )}
        {!showLogin && currentScreen === 'split_confirm' && (
          <SplitConfirmScreen
            currentUser={currentUser}
            splitSelectedIds={splitSelectedIds}
            users={users}
            splitAmountInput={splitAmountInput}
            setSplitAmountInput={setSplitAmountInput}
            shares={shares}
            userSharePercent={userSharePercent}
            handleUserShareChange={handleUserShareChange}
            handleOtherShareChange={handleOtherShareChange}
            handleConfirmSplit={handleConfirmSplit}
            equalizeShares={equalizeShares}
            memoizedAmounts={memoizedAmounts}
            loading={loading}
            message={message}
            setCurrentScreen={setCurrentScreen}
            setSplitSelectedIds={setSplitSelectedIds}
            setShares={setShares}
            setUserSharePercent={setUserSharePercent}
          />
        )}

        {/* Message bar for home, contacts, requests, split selection */}
        {message && !showLogin && currentScreen !== 'transfer' && currentScreen !== 'split_confirm' && (
            <View style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <Text style={styles.message}>{message}</Text>
            </View>
        )}
      </View>
    </ImageBackground>
  );
}
