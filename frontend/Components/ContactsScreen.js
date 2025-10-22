import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import styles from '../Styles.js';
import { renderUser } from './Renderers';

const ContactsScreen = ({ 
  users, 
  currentUser, 
  isRequestFlow, 
  handleSelectRecipient, 
  setCurrentScreen,
  refreshing,
  fetchUsers,
  btnImages
}) => {
  // Filter out the current user (self) from the list
  const filteredUsers = useMemo(() => {
    if (!currentUser) return users;
    return users.filter(u => u.id !== currentUser.id);
  }, [users, currentUser]);

  const userRenderer = renderUser(styles, currentUser, isRequestFlow, handleSelectRecipient);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton} // Apply new padding style
        onPress={() => setCurrentScreen('home')}
        activeOpacity={0.7}
      >
        <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
      </TouchableOpacity>
      <Text style={styles.title}>{isRequestFlow ? 'Zahtevek za plačilo' : 'Nakaži denar'}</Text>
      {isRequestFlow && (
        <TouchableOpacity
          style={
            styles.topRightButton
            }
          onPress={() => setCurrentScreen('receive_qr')}
          activeOpacity={0.7}
        >
          <Image source={btnImages.qr} style={styles.headerIcon} /> 
        </TouchableOpacity>
      )}      <FlatList
        data={filteredUsers} // Use the filtered list
        renderItem={userRenderer}
        keyboardShouldPersistTaps="always"
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={() => {
          fetchUsers();
        }}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No other users found.</Text>}
      />
    </View>
  );
};

export default ContactsScreen;
