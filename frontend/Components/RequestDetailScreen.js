import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import styles from '../Styles';

const RequestDetailScreen = ({
  selectedRequest,
  currentUser,
  handleApproveRequest,
  handleDenyRequest,
  setCurrentScreen,
  loading
}) => {
  if (!selectedRequest) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Napaka: Zahteva ni najdena</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentScreen('requests')}
        >
          <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
        </TouchableOpacity>
      </View>
    );
  }

  const amount = (selectedRequest.amount / 100).toFixed(2);
  const handlePay = async () => {
    await handleApproveRequest(selectedRequest);
    setCurrentScreen('requests');
  };

  const handleReject = async () => {
    await handleDenyRequest(selectedRequest);
    setCurrentScreen('requests');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('requests')}
        activeOpacity={0.7}
      >
        <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
      </TouchableOpacity>
      <Text style={styles.title}>Zahteva od {selectedRequest.requester_name}</Text>
      <View style={styles.transferDetails}>
        <Text style={styles.transferLabel}>Znesek:</Text>
        <Text style={styles.transferAmount}>€{amount}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, styles.payButton]}
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Plačaj</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, styles.rejectButton]}
          onPress={handleReject}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>Zavrni</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RequestDetailScreen;