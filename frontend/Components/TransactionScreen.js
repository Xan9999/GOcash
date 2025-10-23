import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import styles from '../Styles';

// Utility to format transaction data for display
const formatTransaction = (transaction, currentUserId) => {
  const isInitiator = transaction.initiator_id === currentUserId;
  const isRejected = transaction.status === 'rejected';
  const isCompleted = transaction.status === 'completed';  // *** NEW: Add this for completed handling ***
  
  let mainText = 'Activity Log';
  let amountText = transaction.amount ? `€${transaction.amount.toFixed(2)}` : '';
  let color = '#333';

  // Determine the primary user/party involved
  const otherPartyName = isInitiator 
    ? (transaction.target_name || 'System') 
    : (transaction.initiator_name || 'System');
  
  // Set text and color based on transaction type and status
  switch (transaction.type) {
    case 'transfer':
      if (isInitiator) { // Sent money
        mainText = `Za: ${otherPartyName}`;
        color = isRejected ? '#e74c3c' : '#e74c3c'; // Red for out-flow
      } else { // Received money
        mainText = `Od: ${otherPartyName}`;
        color = isRejected ? '#34495e' : '#2ecc71'; // Green for in-flow
      }
      break;
    case 'request_sent':
      mainText = `Prošnja za: ${otherPartyName}`;
      if (isCompleted) {  // *** NEW: Handle approved (completed) ***
        mainText += ' (Potrjena)';
        color = '#2ecc71'; // Green: received money
        amountText = `+€${transaction.amount.toFixed(2)}`;  // *** NEW: Show + for inflow ***
      } else if (isRejected) {
        mainText += ' (Zavrnjena)';
        color = '#e74c3c';  // *** CHANGED: Red for denied (was orange) ***
        amountText = '';  // *** NEW: No amount on denied ***
      } else {
        color = '#f39c12'; // Orange for pending
      }
      break;
    case 'request_received':
      mainText = `Prošnja od: ${otherPartyName}`;
      if (isCompleted) {  // *** NEW: Handle paid (completed) ***
        mainText += ' (Plačana)';
        color = '#e74c3c'; // Red: paid out
        amountText = `-€${transaction.amount.toFixed(2)}`;  // *** NEW: Show - for outflow ***
      } else if (isRejected) {
        mainText += ' (Zavrnjena)';
        color = '#34495e';  // *** CHANGED: Neutral for denied (was red) ***
        amountText = '';  // *** NEW: No amount on denied ***
      } else {
        color = '#f39c12'; // Orange for pending
      }
      break;
    case 'request_approved':
      if (isInitiator) { // Approved a request (Paid out)
        mainText = `Za: ${otherPartyName} (Prošnja potrjena)`;
        color = isRejected ? '#e74c3c' : '#e74c3c'; // Red for out-flow
      } else { // Was requested from and received money (Approved)
        mainText = `Od: ${otherPartyName} (Prošnja potrjena)`;
        color = isRejected ? '#34495e' : '#2ecc71'; // Green for in-flow
      }
      break;
    case 'request_denied':
      if (isInitiator) { // Denied a request
        mainText = `Zavrnjena prošnja od: ${otherPartyName}`;
        color = isRejected ? '#e74c3c' : '#34495e'; // Darker color for denied action
        amountText = ''; // Denied requests don't involve money movement
      } else { // Request to user was denied
        mainText = `Zavrnjena prošnja za: ${otherPartyName}`;
        color = isRejected ? '#e74c3c' : '#34495e'; // Darker color
        amountText = '';
      }
      break;
    case 'split_sent':
      // Simplified log for split initiation
      mainText = `Ustvarjeno razdeljevanje računa:`;
      color = isRejected ? '#e74c3c' : '#34495e';
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
          Opis: {item.memo} 
        </Text>
      ) : null}
      <Text style={styles.transactionDate}>
        {new Date(item.timestamp + "Z").toLocaleString('sl-SI', {timeZone: 'Europe/Ljubljana'})}
      </Text>
    </View>
    <View style={styles.transactionAmountContainer}>
    {item.display_amount ? (
        <Text style={styles.transactionAmount}>
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
        <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
      </TouchableOpacity>
      
      <Text style={styles.title}>Zgodovina transakcij</Text>
      
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
