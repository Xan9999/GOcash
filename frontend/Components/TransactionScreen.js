import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import styles from '../Styles';

// Utility to format transaction data for display
const formatTransaction = (transaction, currentUserId) => {
  const isInitiator = transaction.initiator_id === currentUserId;
  const isRejected = transaction.status === 'rejected';
  const isCompleted = transaction.status === 'completed';  // *** NEW: Add this for completed handling ***
  
  let mainText = 'Activity Log';
  let amountText = transaction.amount ? `€${transaction.amount.toFixed(2)}` : '';
  let color = '#333';
  let icon = '📝'; // Default

  // Determine the primary user/party involved
  const otherPartyName = isInitiator 
    ? (transaction.target_name || 'System') 
    : (transaction.initiator_name || 'System');
  
  // Set text and color based on transaction type and status
  switch (transaction.type) {
    case 'transfer':
      if (isInitiator) { // Sent money
        mainText = `Sent to ${otherPartyName}`;
        color = isRejected ? '#e74c3c' : '#e74c3c'; // Red for out-flow
        icon = '💸';
      } else { // Received money
        mainText = `Received from ${otherPartyName}`;
        color = isRejected ? '#34495e' : '#2ecc71'; // Green for in-flow
        icon = '💰';
      }
      break;
    case 'request_sent':
      mainText = `Requested from ${otherPartyName}`;
      if (isCompleted) {  // *** NEW: Handle approved (completed) ***
        mainText += ' (Approved)';
        color = '#2ecc71'; // Green: received money
        icon = '✅';
        amountText = `+€${transaction.amount.toFixed(2)}`;  // *** NEW: Show + for inflow ***
      } else if (isRejected) {
        mainText += ' (Denied)';
        color = '#e74c3c';  // *** CHANGED: Red for denied (was orange) ***
        icon = '❌';  // *** NEW: Better icon for denied ***
        amountText = '';  // *** NEW: No amount on denied ***
      } else {
        color = '#f39c12'; // Orange for pending
        icon = '👉';
      }
      break;
    case 'request_received':
      mainText = `Request from ${otherPartyName}`;
      if (isCompleted) {  // *** NEW: Handle paid (completed) ***
        mainText += ' (Paid)';
        color = '#e74c3c'; // Red: paid out
        icon = '✅';
        amountText = `-€${transaction.amount.toFixed(2)}`;  // *** NEW: Show - for outflow ***
      } else if (isRejected) {
        mainText += ' (Denied)';
        color = '#34495e';  // *** CHANGED: Neutral for denied (was red) ***
        icon = '❌';  // *** NEW: Better icon for denied ***
        amountText = '';  // *** NEW: No amount on denied ***
      } else {
        color = '#f39c12'; // Orange for pending
        icon = '👈';
      }
      break;
    case 'request_approved':
      if (isInitiator) { // Approved a request (Paid out)
        mainText = `Paid to ${otherPartyName} (Request Approved)`;
        color = isRejected ? '#e74c3c' : '#e74c3c'; // Red for out-flow
        icon = '✅';
      } else { // Was requested from and received money (Approved)
        mainText = `Received from ${otherPartyName} (Request Approved)`;
        color = isRejected ? '#34495e' : '#2ecc71'; // Green for in-flow
        icon = '✅';
      }
      break;
    case 'request_denied':
      if (isInitiator) { // Denied a request
        mainText = `Denied request from ${otherPartyName}`;
        color = isRejected ? '#e74c3c' : '#34495e'; // Darker color for denied action
        icon = '🚫';
        amountText = ''; // Denied requests don't involve money movement
      } else { // Request to user was denied
        mainText = `Request to ${otherPartyName} Denied`;
        color = isRejected ? '#e74c3c' : '#34495e'; // Darker color
        icon = '❌';
        amountText = '';
      }
      break;
    case 'split_sent':
      // Simplified log for split initiation
      mainText = `Initiated split with group`;
      color = isRejected ? '#e74c3c' : '#34495e';
      icon = '👥';
      amountText = ''; // Split sends multiple requests, not one amount
      break;
    default:
      // Other types of logs
      break;
  }
  
  // *** REMOVED: The global if (isRejected) block, as it's now handled per-case ***

  return { 
    ...transaction, 
    display_text: mainText, 
    display_amount: amountText, 
    display_color: color,
    display_icon: icon
  };
};

const TransactionItem = ({ item }) => (
  <View style={styles.transactionSummary}>
    <View style={styles.transactionIconContainer}>
      <Text style={styles.transactionIcon}>{item.display_icon}</Text>
    </View>
    <View style={styles.transactionDetails}>
      <Text style={[styles.transactionText, { color: item.display_color, fontWeight: 'bold' }]}>
        {item.display_text}
      </Text>
      {item.memo ? (
        <Text style={styles.transactionMemo} numberOfLines={1}>
          Memo: {item.memo}
        </Text>
      ) : null}
      <Text style={styles.transactionDate}>
        {new Date(item.timestamp + "Z").toLocaleString('sl-SI', {timeZone: 'Europe/Ljubljana'})}
      </Text>
    </View>
    <View style={styles.transactionAmountContainer}>
    {item.display_amount ? (
        <Text style={[styles.transactionAmount, { color: item.display_color }]}>
        {item.display_amount}
        </Text>
    ) : null}  {/* Render nothing if no amount (avoids empty text node) */}
    </View>
  </View>
);

const TransactionsScreen = ({
  currentUser,
  transactions,
  fetchTransactions,
  refreshing,
  setCurrentScreen,
}) => {
  const currentUserId = currentUser?.id;

  // Process transactions for display
  const formattedTransactions = useMemo(() => {
    return transactions.map(t => formatTransaction(t, currentUserId));
  }, [transactions, currentUserId]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('home')}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Transaction History</Text>
      
      <FlatList
        data={formattedTransactions}
        renderItem={({ item }) => <TransactionItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={fetchTransactions}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No transactions recorded.</Text>}
      />
    </View>
  );
};

export default TransactionsScreen;
