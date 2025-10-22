import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import styles from '../Styles';
import { renderPendingRequest } from './Renderers';

const RequestsScreen = ({
  pendingRequests,
  handleApproveRequest,
  handleDenyRequest,
  setCurrentScreen
}) => {
  const requestRenderer = renderPendingRequest(styles, handleApproveRequest, handleDenyRequest);

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
        renderItem={requestRenderer}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending requests.</Text>}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
};

export default RequestsScreen;
