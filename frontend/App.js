import React, { useState, useEffect, useMemo } from 'react';
import Slider from '@react-native-community/slider';
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
  ImageBackground
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
  const [currentScreen, setCurrentScreen] = useState('home');  // 'home', 'contacts', 'transfer', 'requests', 'split'
  const [selectedRecipient, setSelectedRecipient] = useState(null);  // For transfer/request
  const [isRequestFlow, setIsRequestFlow] = useState(false);  // Send vs Request mode
  const [pendingRequests, setPendingRequests] = useState([]);  // For requests screen
  const [amountInput, setAmountInput] = useState('10');  // Amount input, default 10

  // For split
  const [splitSelectedIds, setSplitSelectedIds] = useState([]); // array of user ids selected
  const [splitAmountInput, setSplitAmountInput] = useState('30'); // total bill in euros
  const [shares, setShares] = useState([]);  // Array of % (0-100) for each selected user, index matches splitSelectedIds

  // Auto-fetch projectId from app.json
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const API_BASE = 'http://192.168.0.109:5000';

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
      // server returns amount in cents; convert to euros for display when rendering
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
        body: JSON.stringify({ pushToken: null }),  // Token sent later if available
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
      fetchPendingRequests();  // Refresh list to remove the approved one
      fetchUsers();  // Update balances
      // No setCurrentScreen('home') - stay on requests screen
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

  // Split: toggle selection for multi-select
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
    const equalPercent = 100 / numOthers;  // e.g., 33.33 for 3 people
    setShares(Array(numOthers).fill(equalPercent));  // Init equal %
    setSplitAmountInput('30');
    setCurrentScreen('split_confirm');
    setMessage('');
  };

  const handleShareChange = (index, newPercent) => {
    const newShares = [...shares];
    newShares[index] = Math.max(0, Math.min(100, newPercent));
    setShares(newShares);  // Safe: memoized amounts handle € updates
  };

  const handleExactInput = (index, text) => {
    const num = parseFloat(text) || 0;
    handleShareChange(index, num);
  };

  const equalizeShares = () => {
    if (shares.length === 0) return;
    const equalPercent = 100 / shares.length;
    setShares(Array(shares.length).fill(equalPercent));
  };

  const memoizedAmounts = useMemo(() => {
    const total = parseFloat(splitAmountInput) || 0;
    return splitSelectedIds.map((id, idx) => {
      const percent = shares[idx] || 0;
      return ((percent / 100) * total);
    });
  }, [splitSelectedIds, shares, splitAmountInput]);  // Only re-run if these change

  // Trigger split request creation
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

    // Normalize shares to sum=100 if not exact (scale proportionally)
    const totalPercent = shares.reduce((sum, p) => sum + p, 0);
    const normalizedShares = shares.map(p => (p / totalPercent) * 100);  // Now sums to 100

    // Convert to cents amounts
    const total_cents = Math.round(total * 100);
    const recipients = splitSelectedIds.map((uid, idx) => {
      const percent = normalizedShares[idx];
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
      setSplitAmountInput('30');
      setCurrentScreen('home');
      fetchPendingRequests();
    } catch (error) {
      console.error('Split error:', error);
      Alert.alert('Split Error', error.message || 'Failed to create split');
    }
    setLoading(false);
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

  // Web polling & visibility handlers (from earlier fix) - keep it for split updates too
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
          <Text style={styles.smallBalance}>Balance: €{(item.balance_cents/100).toFixed(2)}</Text>
        </View>
        <Text style={[styles.actionText, isSelf && styles.disabledText]}>
          {isSelf ? 'You' : isRequestFlow ? 'Request From' : 'Send To'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSplitContact = ({ item }) => {
    const isSelf = item.id === currentUser?.id;
    const selected = splitSelectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.row, isSelf && styles.disabledRow, selected && styles.splitSelectedRow]}
        onPress={() => !isSelf && toggleSplitSelect(item.id)}
        disabled={isSelf}
        activeOpacity={0.7}
      >
        <View style={styles.cell}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.label}>{item.email}</Text>
        </View>
        <Text style={[styles.actionText, isSelf && styles.disabledText]}>
          {isSelf ? 'You' : selected ? 'Selected' : 'Select'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPendingRequest = ({ item }) => (
    <View style={styles.requestRow}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestRequester}>{item.requester_name}</Text>
        <Text style={styles.requestAmount}>€{(item.amount_cents/100).toFixed(2)}</Text>
        <Text style={styles.requestTime}>{item.created_at}</Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApproveRequest(item.id, item.amount_cents, item.requester_name)}
        >
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => handleDenyRequest(item.id, item.requester_name, item.amount_cents)}
        >
          <Text style={styles.denyText}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const HomeScreen = () => {
    const hasPending = pendingRequests.length > 0;
    return (
      <View style={styles.homeContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
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
          <TouchableOpacity
            style={styles.splitButton}
            onPress={() => {
              setSplitSelectedIds([]);
              setShares([]);  // Reset shares
              setCurrentScreen('split');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Split Check</Text>
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

  // Split Screen
  const SplitScreen = () => (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSplitSelectedIds([]);  // Clear on back
          setShares([]);  // Reset shares
          setCurrentScreen('home');
        }}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Split Check</Text>
      <Text style={styles.subtitle}>Select people to split with (you are the payer)</Text>
      <FlatList
        data={users}
        renderItem={renderSplitContact}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />
      <TouchableOpacity
        style={[
          styles.confirmButton, 
          { 
            backgroundColor: splitSelectedIds.length > 0 ? '#FF9800' : '#ccc',
            marginTop: 20 
          }
        ]}
        onPress={handleConfirmSelection}
        disabled={splitSelectedIds.length === 0}
        activeOpacity={0.7}
      >
        <Text style={styles.confirmButtonText}>
          Confirm Selection ({splitSelectedIds.length} selected)
        </Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />}
    </View>
  );


  // Split Confirm Screen (amount entry + sliders for % shares)
  const SplitConfirmScreen = () => {
    if (splitSelectedIds.length === 0) {
      setCurrentScreen('split');
      return null;
    }

    const total = parseFloat(splitAmountInput) || 0;
    const totalPercent = shares.reduce((sum, p) => sum + p, 0);
    const isExact = Math.abs(totalPercent - 100) < 0.01;

    // Use memoized amounts for live € without re-renders
    const selectedUsersWithAmounts = useMemo(() => 
      splitSelectedIds.map((id, idx) => ({
        ...users.find(u => u.id === id),
        isUser: false,
        percent: shares[idx] || 0,
        amount: memoizedAmounts[idx] || 0
      })).filter(Boolean),
    [splitSelectedIds, users, memoizedAmounts, shares]);

    const totalOwed = selectedUsersWithAmounts.reduce((sum, u) => sum + u.amount, 0);
    const yourNet = total - totalOwed;

    const allPeople = useMemo(() => [
      { 
        name: currentUser.name, 
        isUser: true, 
        percent: 100, 
        amount: total,
        net: yourNet
      },
      ...selectedUsersWithAmounts
    ], [currentUser.name, total, yourNet, selectedUsersWithAmounts]);

    // Fixed height for getItemLayout (prevents jumpy re-renders)
    const getItemLayout = (data, index) => ({
      length: 120,  // Approx row height (adjust if needed)
      offset: 120 * index,
      index,
    });

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentScreen('split')}
        >
          <Text style={styles.backText}>← Back to Selection</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Split</Text>
        <Text style={styles.subtitle}>Enter total bill and adjust shares</Text>

        {/* Total Input - Stable typing */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Bill (€):</Text>
          <TextInput
            style={styles.amountInput}
            value={splitAmountInput}
            onChangeText={setSplitAmountInput}
            keyboardType="decimal-pad"
            placeholder="30.00"
            placeholderTextColor="#999"
            selectTextOnFocus={false}  // No auto-highlight on focus
            contextMenuHidden={true}   // No menu/focus steal
            autoFocus={true}
            blurOnSubmit={false}       // Keep focus after enter
          />
        </View>

        {/* Equalize Button */}
        <TouchableOpacity
          style={[styles.sendButton, { width: '80%', alignSelf: 'center', marginBottom: 10 }]}
          onPress={equalizeShares}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Equal Split</Text>
        </TouchableOpacity>

        {/* Optimized FlatList - No flicker, live € */}
        <Text style={[styles.subtitle, { marginTop: 10, marginBottom: 10 }]}>Share Preview:</Text>
        <FlatList
          data={allPeople}
          keyExtractor={(item, index) => (item.id || index).toString()}
          getItemLayout={getItemLayout}              // Fixed layout, no jumps
          initialNumToRender={allPeople.length}      // Render all at once
          maxToRenderPerBatch={allPeople.length}     // Batch all
          windowSize={10}                            // Small window for perf
          removeClippedSubviews={false}              // No clipping flicker
          renderItem={({ item, index }) => (
            <View style={styles.shareRow}>
              <View style={styles.cell}>
                <Text style={[
                  styles.name, 
                  item.isUser && { fontSize: 26, fontWeight: '800' }
                ]}>
                  {item.name}
                </Text>
                <Text 
                  style={[styles.label, { marginTop: 5 }]} 
                  selectable={false}  // Explicit no-focus/select
                >
                  {item.isUser 
                    ? `Net Receive: €${item.net.toFixed(2)}` 
                    : `Pays €${item.amount.toFixed(2)}`
                  }
                </Text>
              </View>
              {!item.isUser && (
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    value={item.percent}
                    onValueChange={(value) => handleShareChange(index - 1, value)}  // Live during drag
                    minimumTrackTintColor="#FF9800"
                    maximumTrackTintColor="#ddd"
                    thumbTintColor="#FF9800"
                    step={1}
                    tapOffset={10}  // Precise touch without interference
                  />
                </View>
              )}
            </View>
          )}
          style={{ flex: 1 }}
        />

        <TouchableOpacity
          style={[
            styles.confirmButton, 
            { backgroundColor: isExact ? '#4CAF50' : '#FF9800' }
          ]}
          onPress={handleConfirmSplit}
          disabled={loading || total <= 0}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>Create Split Requests</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  };

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
        <Text style={styles.amountLabel}>Amount (€):</Text>
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
      <ImageBackground
    source={require('./assets/Background.jpg')}
    style={styles.backgroundImage}
    resizeMode="cover">
    <View style={styles.container}>
      <Modal visible={showLogin} animationType="slide" transparent>
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
      {!showLogin && currentScreen === 'split' && <SplitScreen />}
      {!showLogin && currentScreen === 'split_confirm' && <SplitConfirmScreen />}
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
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
    marginBottom: 20,
    width: 200,
  },
  splitButton: {
    backgroundColor: '#FF9800',
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
  splitSelectedRow: {
    borderWidth: 2,
    borderColor: '#FF9800',
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
    marginTop: 5,
  },
  smallBalance: {
    marginTop: 6,
    color: '#444',
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
  previewRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
  },
  sliderContainer: {
    alignItems: 'center',
    width: 150,
    marginLeft: 20,
  },
  slider: {
    width: 120,
    height: 40,
  },
  percentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 5,
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#282c34',
    textAlign: 'center',
    marginVertical: 2,
  },
});