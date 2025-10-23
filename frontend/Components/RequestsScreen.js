import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import styles from '../Styles';

const RequestsScreen = ({
  pendingRequests,
  setCurrentScreen,
  setSelectedRequest
}) => {
  const renderRequestItem = ({ item }) => (
    <TouchableOpacity
      style={styles.pendingRequestItem}
      onPress={() => {
        setSelectedRequest(item);
        setCurrentScreen('request_detail');
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.pendingRequestText}>
        {item.requester_name}: €{(item.amount / 100).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('home')}
        activeOpacity={0.7}
      >
        <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
      </TouchableOpacity>
      <Text style={styles.title}>Zahteve</Text>
      <FlatList
        data={pendingRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Ni zahtev.</Text>}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
};

export default RequestsScreen;