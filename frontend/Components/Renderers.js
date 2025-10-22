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
export const renderUser = (styles, currentUser, isRequestFlow, handleSelectRecipient) => ({ item }) => {
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

// Renderer for the Split selection screen
export const renderSplitContact = (styles, currentUser, splitSelectedIds, toggleSplitSelect) => ({ item }) => {
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
        onPress={() => handleDenyRequest(item.id, item.requester_name, item.amount_cents)}
      >
        <Text style={styles.denyText}>Deny</Text>
      </TouchableOpacity>
    </View>
  </View>
);
