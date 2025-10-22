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
      {/* QR Scan Button - Top Right */}
      <TouchableOpacity
        style={styles.topRightButton}
        onPress={() => console.log('Scan QR button pressed - does nothing yet')}
        activeOpacity={0.7}
      >
        <Image
          source={btnImages.scan}
          style={styles.headerIcon}
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

      <View style={styles.footerContainer}>
        <TouchableOpacity onPress={handleLogout}>
          <Image source={btnImages.logout} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => setCurrentScreen('requests')}
          activeOpacity={0.7}
        >
          <Image source={chatIconSource} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => setCurrentScreen('transactions')}
        >
          <Image source={btnImages.history} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;
