import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import styles from '../Styles';
import { renderUser } from './Renderers';

const ContactsScreen = ({ 
  users, 
  currentUser, 
  isRequestFlow, 
  handleSelectRecipient, 
  setCurrentScreen,
  refreshing,
  fetchUsers
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
        style={[styles.backButton, styles.backButtonPadded]} // Apply new padding style
        onPress={() => setCurrentScreen('home')}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Select {isRequestFlow ? 'Payer' : 'Recipient'}</Text>
      <FlatList
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
