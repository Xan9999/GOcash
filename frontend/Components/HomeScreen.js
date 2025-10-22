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
    <View style={styles.centeredContainer}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.buttonText}>Odjava</Text>
      </TouchableOpacity>

      <Text style={styles.homeTitle}>Flik 2</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.circleButton]}
          onPress={() => {
            setIsRequestFlow(false);
            setCurrentScreen('contacts');
          }}
          activeOpacity={0.7}
        >
          <Image source={btnImages.send} style={styles.icon} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleButton]}
          onPress={() => {
            setIsRequestFlow(true);
            setCurrentScreen('contacts');
          }}
          activeOpacity={0.7}
        >
          <Image source={btnImages.request} style={[styles.icon, styles.rotatedIcon]} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleButton]}
          onPress={() => {
            setSplitSelectedIds([]);
            setShares([]);
            setCurrentScreen('split');
          }}
          activeOpacity={0.7}
        >
          <Image source={btnImages.split} style={styles.icon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.historyButton, { marginTop: 10 }]} 
        onPress={() => setCurrentScreen('transactions')}
        activeOpacity={0.7}
      >
        <Text style={styles.historyButtonText}>Transaction History</Text>
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