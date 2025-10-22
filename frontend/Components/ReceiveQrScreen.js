import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import styles from '../Styles';

// Using an existing asset as a placeholder for the "fake" generated QR code image
const fakeQrPlaceholderImage = require('../assets/Example_QR_code.png'); 

const ReceiveQrScreen = ({
  amountInput: initialAmountInput, // Initial amount passed from App.js state
  currentUser,
  setCurrentScreen,
}) => {
  const [showQr, setShowQr] = useState(false);
  // Local state for the amount to generate the QR for, initialized from global state
  const [localAmount, setLocalAmount] = useState(initialAmountInput);

  const handleGenerateQr = () => {
    // Only show QR if amount is valid
    const amount = parseFloat(localAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a positive amount.');
      return;
    }
    setShowQr(true);
  };

  return (
    <ScrollView 
      style={styles.container} 
      keyboardShouldPersistTaps="always" 
      contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
      key="receive-qr-scroll" 
    >
      {/* Top Left Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setCurrentScreen('contacts');
        }}
        activeOpacity={0.7}
      >
        <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
      </TouchableOpacity>

      <Text style={styles.title}>Ustvari QR Kodo za Prejem</Text>
      
      <View style={styles.recipientInfo}>
        <Text style={styles.recipientName}>{currentUser?.name}</Text>
        <Text style={styles.recipientPhone}>{currentUser?.phone}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountdetailLabel}>Znesek (€):</Text>
        <TextInput
          style={styles.amountInput}
          value={localAmount}
          onChangeText={(text) => {
            setLocalAmount(text);
            setShowQr(false); // Hide QR when amount changes
          }}
          keyboardType="decimal-pad"
          placeholder="10"
          placeholderTextColor="#999"
          selectTextOnFocus={false}
          contextMenuHidden={true}
          blurOnSubmit={false}
          keyboardShouldPersistTaps="always"
          autoFocus={true}
          returnKeyType="done"
          onSubmitEditing={handleGenerateQr}
        />
      </View>

      {!showQr && (
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: '#4CAF50' } // Green for Receive/Request
          ]}
          onPress={handleGenerateQr}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>Generiraj QR Kodo</Text>
        </TouchableOpacity>
      )}

      {showQr && (
        <View style={styles.qrCodeContainer}>
          <Text style={styles.subtitle}>Skeniraj za plačilo €{parseFloat(localAmount || 0).toFixed(2)}</Text>
          <Image 
            source={fakeQrPlaceholderImage} 
            style={[styles.qrCodeImage, { width: 300, height: 300, alignSelf: 'center', marginVertical: 20 }]} 
            resizeMode="contain" 
          />
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default memo(ReceiveQrScreen);