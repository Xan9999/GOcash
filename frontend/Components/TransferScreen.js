import React, { memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import styles from '../Styles';

const TransferScreen = ({
  selectedRecipient,
  isRequestFlow,
  amountInput,
  setAmountInput,
  handleConfirmTransfer,
  setCurrentScreen,
  setSelectedRecipient,
  loading,
  message
}) => (
  <ScrollView 
    style={styles.container} 
    keyboardShouldPersistTaps="always" 
    contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
    // The key ensures React treats this ScrollView as a consistent element,
    // which helps prevent the keyboard from dismissing on state change.
    key="transfer-scroll" 
  >
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => {
        setSelectedRecipient(null);
        setCurrentScreen('contacts');
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.backText}>← Back to Contacts</Text>
    </TouchableOpacity>
    <Text style={styles.title}>
      {isRequestFlow ? 
        `Request from ${selectedRecipient?.name}` : 
        `Send to ${selectedRecipient?.name}`
      }
    </Text>
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
        keyboardType="decimal-pad"
        placeholder="10"
        placeholderTextColor="#999"
        selectTextOnFocus={false}
        contextMenuHidden={true}
        blurOnSubmit={false}
        keyboardShouldPersistTaps="always"
        autoFocus={true}
        returnKeyType="done"
        onSubmitEditing={handleConfirmTransfer}
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
    <View style={{ height: 50 }} />
  </ScrollView>
);

export default memo(TransferScreen);
