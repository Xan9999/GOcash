import React, { memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image } from 'react-native';
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
      <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
    </TouchableOpacity>
    <Text style={styles.title}>
      {isRequestFlow ? 
        `Zahtevek za plačilo` : 
        `Nakaži denar`
      }
    </Text>
    <Image source={require('../assets/user-icon.png')} style={styles.userIcon} />
    <View style={styles.recipientInfo}>
      <Text style={styles.recipientName}>{selectedRecipient?.name}</Text>
      <Text style={styles.recipientPhone}>{selectedRecipient?.phone}</Text>
    </View>
    <View style={styles.amountContainer}>
      <Text style={styles.amountdetailLabel}>Znesek (€):</Text>
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
      style={[styles.confirmButton, { width: '100%', marginTop: 30, height: 50 }]}
      onPress={handleConfirmTransfer}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Text style={styles.confirmButtonText}>{isRequestFlow ? 'Pošlji zahtevek' : 'Nakaži'}</Text>
    </TouchableOpacity>
    {loading && <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />}
    {message ? <Text style={styles.message}>{message}</Text> : null}
    <View style={{ height: 50 }} />
  </ScrollView>
);

export default memo(TransferScreen);
