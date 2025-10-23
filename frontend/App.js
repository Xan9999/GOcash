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
import GroupCreationScreen from './Components/GroupCreationScreen'; 
import ReceiveQrScreen from './Components/ReceiveQrScreen'; // NEW
import { renderLoginUser } from './Components/Renderers';
import TransactionScreen from './Components/TransactionScreen';
import RequestDetailScreen from './Components/RequestDetailScreen'; // NEW

// Add image requires (place after imports)
const btnImages = {
  send: require('./assets/moneyout.png'),
  request: require('./assets/moneyin.png'),
  split: require('./assets/group.png'),
  chat: require('./assets/chat.png'),
  chatUnread: require('./assets/chat-unread.png'),
  history: require('./assets/history.png'),
  logout: require('./assets/logout.png'),
  scan: require('./assets/camera.png'),
  qr: require('./assets/qr-code.png'),
};

  export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  // Updated comment: 'receive_qr' added
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'contacts', 'transfer', 'requests', 'request_detail', 'split', 'split_confirm', 'group_create', 'receive_qr'
  const [selectedRecipient, setSelectedRecipient] = useState(null); // For transfer/request
  const [selectedRequest, setSelectedRequest] = useState(null); // NEW: For request detail
  const [isRequestFlow, setIsRequestFlow] = useState(false); // Send vs Request mode
  const [pendingRequests, setPendingRequests] = useState([]); // For requests screen
  const [amountInput, setAmountInput] = useState(''); // Amount input, default 10
  const [transactions, setTransactions] = useState([]);
  const [refreshingTransactions, setRefreshingTransactions] = useState(false);

  // For split: NOTE: These are now treated as WEIGHTS (0-100), not fixed percentages.
  const [splitSelectedIds, setSplitSelectedIds] = useState([]); // array of user ids selected
  const [splitAmountInput, setSplitAmountInput] = useState(''); // total bill in euros
  // Setting initial weights to 50 for a middle-point starting position
  const [shares, setShares] = useState([]); // Array of WEIGHTS (0-100) for each selected user
  const [userSharePercent, setUserSharePercent] = useState(50); // User's WEIGHT, starts at 50

  // --- NEW: Group State ---
  const [groups, setGroups] = useState([]); 

  

  // Auto-fetch projectId from app.json
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const API_BASE = 'http://192.168.0.115:5000'; // Keep this here as it's logic/config

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
  
  // --- NEW: Fetch Groups ---
  const fetchGroups = async (userId) => {
    if (!userId) return;
    console.log('Fetching groups...');
    try {
      const response = await fetch(`${API_BASE}/groups?user_id=${userId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch groups`);
      const data = await response.json();
      setGroups(data);
      console.log('Groups fetched:', data.length);
    } catch (error) {
      console.error('Fetch groups error:', error);
    }
  };
  
  const handleCreateGroup = async (groupName, memberIds, redirectToSplitConfirm = false) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const body = {
        creator_id: currentUser.id,
        name: groupName,
        member_ids: memberIds,
      };
      
      const response = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create group');
      }
      
      // setMessage(`Group '${groupName}' created successfully!`);
      fetchGroups(currentUser.id); // Refresh group list
      
      if (redirectToSplitConfirm) {
        // Automatically select group members and navigate to confirm screen
        setSplitSelectedIds(memberIds);
        handleConfirmSelection(memberIds); // Use the new signature
      } else {
        // Go back to the split selection screen
        setCurrentScreen('split');
      }

    } catch (error) {
      console.error('Group creation error:', error);
      Alert.alert('Group Error', error.message);
    }
    setLoading(false);
  };

  const handleGroupSelection = (memberIds) => {
    // Select all members of the group and go to split confirm screen
    const otherMemberIds = memberIds.filter(id => id !== currentUser.id);
    setSplitSelectedIds(otherMemberIds);
    handleConfirmSelection(otherMemberIds); // Use the new signature
  };

  const fetchPendingRequests = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE}/pending_requests?user_id=${currentUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setPendingRequests(data);
      console.log('Pending requests updated:', data.length);
      return data.length; // Return count for approval logic
    } catch (error) {
      console.error('Requests fetch error:', error);
      return 0;
    }
  };

  const fetchTransactions = async () => {
    if (!currentUser) return;
    console.log('Fetching transactions...');
    setRefreshingTransactions(true);
    try {
      const response = await fetch(`${API_BASE}/transactions?user_id=${currentUser.id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      setTransactions(data);
      console.log('Transactions fetched:', data.length);
    } catch (error) {
      console.error('Fetch transactions error:', error);
      setMessage('Error fetching transactions!');
      Alert.alert('Error', error.message);
    }
    setRefreshingTransactions(false);
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
      // Removed notification warning for web since it's now handled by platform check
      // setMessage(`Logged in as ${user.name}${Platform.OS === 'web' ? ' (Web: Notifications disabled)' : ''}`); 
      console.log('Login success, hiding modal');
      fetchUsers();
      fetchGroups(user.id); // Fetch groups after successful login
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
      setGroups([]); // Clear groups on logout
      setMessage('Logged out.');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', error.message || 'Failed to logout.');
    }
    setLoading(false);
  };

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setAmountInput(''); // Reset amount
    setCurrentScreen('transfer');
    setMessage(''); // Clear message
  };

  const handleConfirmTransfer = async () => {
    if (!selectedRecipient || !amountInput) {
      // setMessage('Please select a recipient and enter an amount.');
      return;
    }
    const amountCents = Math.round(parseFloat(amountInput) * 100);
    if (amountCents <= 0) {
      // setMessage('Amount must be positive.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const body = {
        amount_cents: amountCents,
        memo: '',  // Add memo input later if needed
      };
      let endpoint;
      if (isRequestFlow) {
        // Request mode: Use /request_money
        endpoint = '/request_money';
        body.requester_iban = currentUser.iban;
        body.payer_iban = selectedRecipient.iban;
        body.requester_name = currentUser.name;  // For notification
      } else {
        // Send mode: Use /transfer_money
        endpoint = '/transfer_money';
        body.sender_iban = currentUser.iban;
        body.receiver_iban = selectedRecipient.iban;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      // setMessage(
      //   `Success: ${isRequestFlow ? 'Request sent' : 'Money sent'} for €${amountInput}!`
      // );
      setSelectedRecipient(null);
      setAmountInput('');
      setIsRequestFlow(false);
      setCurrentScreen('home');
      fetchPendingRequests();
      fetchTransactions();
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert('Transfer Error', error.message);
    }
    setLoading(false);
  };

  // NEW: Approve Request Handler
  const handleApproveRequest = async (request) => {
    if (!currentUser || !request) return;
    setLoading(true);
    try {
      const body = {
        payer_iban: currentUser.iban,
        receiver_iban: request.requester_iban,
        amount_cents: request.amount
      };
      const response = await fetch(`${API_BASE}/approve_request/${request.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const responseText = await response.text();
      console.log('Approve response status:', response.status, 'body:', responseText);
      if (!response.ok) {
        let errorMsg = `Failed to approve: HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg += ` - ${errorJson.error || 'Unknown error'}`;
        } catch {}
        throw new Error(errorMsg);
      }
      await fetchPendingRequests();
      await fetchTransactions();
      setMessage('Zahteva odobrena in plačana!');
    } catch (error) {
      console.error('Approve error:', error);
      Alert.alert('Napaka', error.message);
    }
    setLoading(false);
  };

  // NEW: Deny Request Handler
  const handleDenyRequest = async (request) => {
    if (!currentUser || !request) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/deny_request/${request.id}`, {
        method: 'POST',
      });
      const responseText = await response.text();
      console.log('Deny response status:', response.status, 'body:', responseText);
      if (!response.ok) {
        let errorMsg = `Failed to deny: HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg += ` - ${errorJson.error || 'Unknown error'}`;
        } catch {}
        throw new Error(errorMsg);
      }
      await fetchPendingRequests();
      setMessage('Zahteva zavrnjena.');
    } catch (error) {
      console.error('Deny error:', error);
      Alert.alert('Napaka', error.message);
    }
    setLoading(false);
  };

  // Split selection handlers (assuming these exist from original code)
  const toggleSplitSelect = (userId) => {
    setSplitSelectedIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirmSelection = (selectedIds) => {
    if (selectedIds.length > 0) {
      setShares(Array(selectedIds.length).fill(50));
      setUserSharePercent(50);
      setSplitAmountInput('');

      setCurrentScreen('split_confirm');
    } else {
      Alert.alert('No Selection', 'Please select at least one person.');
    }
  };

  const handleUserShareChange = (value) => {
    setUserSharePercent(value);
  };

  const handleOtherShareChange = (index, value) => {
    setShares(prev => {
      const newShares = [...prev];
      newShares[index] = value;
      return newShares;
    });
  };

  const equalizeShares = () => {
    const numOthers = splitSelectedIds.length;
    if (numOthers === 0) return;
    const equalWeight = 50;
    setUserSharePercent(equalWeight);
    setShares(Array(numOthers).fill(equalWeight));
  };

  // Memoized calculation for split: Calculate amounts and percentages based on proportional weights
  const memoizedAmounts = useMemo(() => {
    const total = parseFloat(splitAmountInput) || 0;
    // allPercents are now treated as weights
    const allWeights = [userSharePercent, ...shares]; 
    const totalWeight = allWeights.reduce((sum, w) => sum + w, 0);
    
    if (totalWeight === 0) {
      // If total weight is zero, everyone pays zero
      return { 
        user: 0, 
        others: shares.map(() => 0), 
        normalizedPercents: allWeights.map(() => 0) 
      };
    }

    // Calculate proportional amounts (Individual Weight / Total Weight) * Total Bill
    const userAmount = (userSharePercent / totalWeight) * total;
    const otherAmounts = shares.map(weight => (weight / totalWeight) * total);
    
    // Calculate final, displayed percentage (Individual Weight / Total Weight) * 100
    const normalizedAll = allWeights.map(weight => (weight / totalWeight) * 100);

    return { 
      user: userAmount, 
      others: otherAmounts, 
      normalizedPercents: normalizedAll 
    };
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

    // Check if total weight is zero
    const totalWeight = userSharePercent + shares.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) {
      Alert.alert('Invalid Split', 'Please set a share for at least one person.');
      return;
    }

    const { others: requestedAmounts } = memoizedAmounts;

    // The total split amount should always equal the total bill due to the proportional calculation.
    const totalSplitAmount = requestedAmounts.reduce((sum, amount) => sum + amount, 0) + memoizedAmounts.user;
    
    // Safety check (should pass if totalWeight > 0)
    if (Math.abs(totalSplitAmount - total) > 0.01) {
      Alert.alert('Calculation Error', 'Internal calculation error: Total split amounts do not match the total bill.');
      return;
    }

    const total_cents = Math.round(total * 100);
    
    // Map to IBANs for recipients (the people who owe the user money)
    const recipientsWithIban = splitSelectedIds.map((uid, idx) => {
      const u = users.find(x => x.id === uid);
      // We are requesting the 'other' amount from them
      const amount_cents = Math.round(requestedAmounts[idx] * 100);
      return { iban: u.iban, name: u.name, amount_cents };
    }).filter(r => r.amount_cents > 0); // Only request if amount > 0

    if (recipientsWithIban.length === 0 && memoizedAmounts.user === total) {
      Alert.alert('No Requests Needed', 'Since you are paying the full bill yourself, no requests are needed.');
      return;
    }

    const body = {
      // Payer is the current user, who is requesting money from the recipients
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
      // Reset
      setSplitSelectedIds([]);
      setShares([]);
      setUserSharePercent(50); // Reset to 50
      setSplitAmountInput('');
      setCurrentScreen('home');
      fetchPendingRequests();
    } catch (error) {
      console.error('Split error:', error);
      Alert.alert('Split Error', error.message || 'Failed to create split');
    }
    setLoading(false);
  };
  // --- End Split Handlers ---

  // Load persisted login and initial data fetches
  useEffect(() => {
    const loadUser = async () => {
      if (users.length === 0) return;
      const savedId = await AsyncStorage.getItem('currentUserId');
      const numericId = savedId ? parseInt(savedId) : null;
      console.log('Checking saved login:', savedId);
      if (numericId) {
        const savedUser = users.find(u => u.id === numericId);
        if (savedUser) {
          console.log('Restoring login for:', savedUser.name);
          setCurrentUser(savedUser);
          setShowLogin(false);
          fetchUsers();
          fetchGroups(numericId); // Fetch groups on startup
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
  
  // Fetch groups and requests when user logs in/changes
  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.id);
      fetchPendingRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentScreen === 'split') {
      fetchGroups(currentUser.id);
    }
  }, [currentUser, currentScreen]);

  // Refresh pending requests when on home screen
  useEffect(() => {
    if (currentUser && currentScreen === 'home') {
      fetchPendingRequests();
    }
  }, [currentUser, currentScreen]);

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.id);
      fetchPendingRequests();
      if (currentScreen === 'transactions') {
        fetchTransactions();
      }
    }
  }, [currentUser, currentScreen]);

  // Web polling & visibility handlers (from earlier fix)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!currentUser) return;

  console.log('Starting web polling & visibility handlers for pending requests and transactions');

    // Initial fetch based on current screen
    if (currentScreen === 'requests' || currentScreen === 'home') {  // *** ADDED: 'home' ***
      fetchPendingRequests();
    } else if (currentScreen === 'transactions') {
      fetchTransactions();
    }

    const POLL_MS = 10000;
    const intervalId = setInterval(() => {
      // Poll conditionally based on current screen
      if (currentScreen === 'requests' || currentScreen === 'home') {  // *** ADDED: 'home' ***
        fetchPendingRequests();
      } else if (currentScreen === 'transactions') {
        fetchTransactions();
      }
    }, POLL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (currentScreen === 'requests' || currentScreen === 'home') {  // *** ADDED: 'home' ***
          fetchPendingRequests();
        } else if (currentScreen === 'transactions') {
          fetchTransactions();
        }
      }
    };
    const onFocus = () => {
      if (currentScreen === 'requests' || currentScreen === 'home') {  // *** ADDED: 'home' ***
        fetchPendingRequests();
      } else if (currentScreen === 'transactions') {
        fetchTransactions();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser, currentScreen]);  // Already has currentScreen dep
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
      style={styles.darkContainer}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Modal visible={showLogin} animationType="slide" transparent>
          <View style={styles.darkContainer}>
            <Text style={styles.title}>Vpišite se v Flik 2</Text>
            <Text style={styles.subtitle}>Izberite račun:</Text>
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
            btnImages={btnImages}  

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
            btnImages={btnImages} // NEW PROP
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
            setCurrentScreen={setCurrentScreen}
            setSelectedRequest={setSelectedRequest}
          />
        )}
        {!showLogin && currentScreen === 'request_detail' && (
          <RequestDetailScreen
            selectedRequest={selectedRequest}
            currentUser={currentUser}
            handleApproveRequest={handleApproveRequest}
            handleDenyRequest={handleDenyRequest}
            setCurrentScreen={setCurrentScreen}
            loading={loading}
          />
        )}
        {!showLogin && currentScreen === 'transactions' && (
          <TransactionScreen 
            currentUser={currentUser}
            transactions={transactions}
            fetchTransactions={fetchTransactions}
            refreshing={refreshingTransactions}
            setCurrentScreen={setCurrentScreen}
          />
        )}
        {!showLogin && currentScreen === 'split' && (
          <SplitSelectionScreen
            users={users.filter(u => u.id !== currentUser.id)} // Filter out current user
            currentUser={currentUser}
            splitSelectedIds={splitSelectedIds}
            toggleSplitSelect={toggleSplitSelect}
            handleConfirmSelection={handleConfirmSelection}
            setCurrentScreen={setCurrentScreen}
            setSplitSelectedIds={setSplitSelectedIds}
            setShares={setShares}
            setUserSharePercent={setUserSharePercent}
            loading={loading}
            groups={groups} // NEW
            handleGroupSelection={handleGroupSelection} // NEW
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
        
        {/* NEW: Group Creation Screen */}
        {!showLogin && currentScreen === 'group_create' && (
          <GroupCreationScreen
            currentUser={currentUser}
            users={users}
            splitSelectedIds={splitSelectedIds} // Members already selected
            handleCreateGroup={handleCreateGroup}
            setCurrentScreen={setCurrentScreen}
            loading={loading}
          />
        )}

        {!showLogin && currentScreen === 'receive_qr' && (
          <ReceiveQrScreen
            amountInput={amountInput} // Pass global amount for initial value
            currentUser={currentUser}
            setCurrentScreen={setCurrentScreen}
          />
        )}

        {/* Message bar for home, contacts, requests, split selection, group creation */}
        {message && !showLogin && currentScreen !== 'transfer' && currentScreen !== 'split_confirm' && currentScreen !== 'request_detail' && (
            <View style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <Text style={styles.message}>{message}</Text>
            </View>
        )}
      </View>
    </ImageBackground>
  );
}