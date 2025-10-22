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
  const chatIconSource = hasPending ? btnImages.chatUnread : btnImages.chat;

  return (
    <View style={styles.centeredContainer}>
      {/* Logout Button (Top Right) */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      
      {/* NEW: Chat/Requests Icon (Top Right Corner, positioned relative to the HomeScreen View) */}
      <TouchableOpacity
        style={styles.chatIcon} // Positioned absolutely via style
        onPress={() => setCurrentScreen('requests')}
        activeOpacity={0.7}
      >
        <Image 
          source={chatIconSource} 
          style={styles.headerIcon} // New style for icon size and tint
          resizeMode="contain" 
        />
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
          <Image source={btnImages.request} style={styles.icon} resizeMode="contain" />
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
      {/* Removed the old pending requests button block */}
    </View>
  );
};

export default HomeScreen;
