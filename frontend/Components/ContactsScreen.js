import React from 'react';
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
  const userRenderer = renderUser(styles, currentUser, isRequestFlow, handleSelectRecipient);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('home')}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Select {isRequestFlow ? 'Payer' : 'Recipient'}</Text>
      <FlatList
        data={users}
        renderItem={userRenderer}
        keyboardShouldPersistTaps="always"
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={() => {
          fetchUsers();
        }}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
};

export default ContactsScreen;
