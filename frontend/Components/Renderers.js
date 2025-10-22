import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
        <Text style={styles.label}>{item.phone}</Text>
        {/* Assumes backend now correctly supplies 'balance' (a float/number) */}
        <Text style={styles.contactBalance}>Balance: €{item.balance.toFixed(2)}</Text>
      </View>
      <Text style={styles.actionText}>
        {isRequestFlow ? 'Request From' : 'Send To'}
      </Text>
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
        <Text style={styles.label}>{item.email}</Text>
      </View>
      {/* NO ACTION TEXT on Split Selection screen as requested */}
    </TouchableOpacity>
  );
};

// Renderer for the Requests screen
export const renderPendingRequest = (styles, handleApproveRequest, handleDenyRequest) => ({ item }) => (
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
        onPress={() => handleDenyRequest(item.id, item.requester_name)}
      >
        <Text style={styles.denyText}>Deny</Text>
      </TouchableOpacity>
    </View>
  </View>
);
