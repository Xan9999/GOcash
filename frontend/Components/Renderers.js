import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import TestScreen from './Requests';
import styles from '../Styles';

// Renderer for the initial login screen user list
export const renderLoginUser = (styles, handleLogin) => ({ item }) => (
  <TouchableOpacity 
    style={styles.loginRow} 
    onPress={() => handleLogin(item)}
    activeOpacity={0.8}
  >
    <Text style={styles.loginName}>{item.name}</Text>
    <Text style={styles.loginDetail}>{item.email}</Text>
  </TouchableOpacity>
);

// Renderer for the Contacts screen (Send/Request flow)
// NOTE: isSelf check is removed in ContactsScreen.js
export const renderUser = (styles, currentUser, isRequestFlow, handleSelectRecipient) => ({ item }) => {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => handleSelectRecipient(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cell}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detailLabel}>{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Renderer for the Split Selection screen
// Action text is removed as requested
export const renderSplitUser = (styles, toggleSplitSelect, splitSelectedIds) => ({ item }) => {
  const selected = splitSelectedIds.includes(item.id);
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.splitSelectedRow]}
      onPress={() => toggleSplitSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cell}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detailLabel}>{item.email}</Text>
      </View>
      {/* NO ACTION TEXT on Split Selection screen as requested */}
    </TouchableOpacity>
  );
};

// Renderer for pending requests
export const renderPendingRequest = (styles, onApprove, onDeny, setCurrentScreen) => ({ item }) => {
  // Safe amount formatting: Convert to number, default to 0, then format
  const safeAmount = Number(item.amount || 0).toFixed(2);
  
  return (
    <TouchableOpacity
      style={styles.requestRow}
      activeOpacity={0.7}
      onPress={() => setCurrentScreen('test', { requestId: item.id, amount: item.amount })}
    >
      <View style={styles.requestInfo}>
        <Text style={styles.requestRequester}>
          Od: {item.requester_name}   {safeAmount}€
        </Text>
        <Text style={styles.requestInfo}>
          Prejet zahtevek za plačilo v znesku
        </Text>
        <Text style={styles.requestTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.approveButton, { backgroundColor: '#4CAF50', right: 100, position: 'absolute' }]}
          onPress={() => onApprove(item.id, item.amount * 100)} // Pass cents back
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Plačaj</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.denyButton, { backgroundColor: '#f44336', right: 10 }]}
          onPress={() => onDeny(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Zavrni</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};