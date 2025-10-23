import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../Styles';

export const renderRequest = ({ item }) => {
  // Safe amount formatting: Convert to number, default to 0, then format
  const safeAmount = Number(item.amount || 0).toFixed(2);
  return (
    <View style={styles.requestInfo}>
      <Text>Test</Text>
    </View>
  );
};

const TestScreen = ({ setCurrentScreen, requestId, amount, onApprove, onDeny }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.backButton, styles.backButtonPadded]}
        onPress={() => setCurrentScreen('home')} // Navigate back to home or previous screen
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Test</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => {
            onApprove(requestId, amount * 100); // Pass amount in cents
            setCurrentScreen('home'); // Navigate back after action
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => {
            onDeny(requestId);
            setCurrentScreen('home'); // Navigate back after action
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TestScreen;