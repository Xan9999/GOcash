// Updated HomeScreen.js to add Transaction History button
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import styles from '../Styles';

const HomeScreen = ({ 
  currentUser, 
  handleLogout, 
  pendingRequests, 
  setCurrentScreen, 
  setIsRequestFlow,
  setSplitSelectedIds,
  setShares,
  btnImages
}) => {
  const hasPending = pendingRequests.length > 0;
  return (
    <View style={styles.homeContainer}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.homeTitle}>Welcome, {currentUser?.name}!</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {
            setIsRequestFlow(false);
            setCurrentScreen('contacts');
          }}
          activeOpacity={0.7}
        >
          <Image source={btnImages.send} style={styles.image} resizeMode="contain" />
          <Text style={styles.buttonText}>Send Money</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.receiveButton}
          onPress={() => {
            setIsRequestFlow(true);
            setCurrentScreen('contacts');
          }}
          activeOpacity={0.7}
        >
          <Image source={btnImages.request} style={styles.image} resizeMode="contain"  />
          <Text style={styles.buttonText}>Request Money</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.splitButton}
          onPress={() => {
            setSplitSelectedIds([]);
            setShares([]);
            setCurrentScreen('split');
          }}
          activeOpacity={0.7}
        >
          <Image source={btnImages.split} style={styles.image} resizeMode="contain" />
          <Text style={styles.buttonText}>Split Check</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.historyButton, { marginTop: 10 }]}
        onPress={() => setCurrentScreen('transactions')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Transaction History</Text>
      </TouchableOpacity>
      {hasPending && (
        <TouchableOpacity
          style={styles.pendingButton}
          onPress={() => setCurrentScreen('requests')}
          activeOpacity={0.7}
        >
          <Text style={styles.pendingText}>View {pendingRequests.length} Pending Request{pendingRequests.length > 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default HomeScreen;