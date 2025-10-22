import React, { memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import styles from '../Styles';
import { renderSplitContact } from './Renderers';

const SplitSelectionScreen = ({
  users, // Note: users array passed here is already filtered by App.js
  currentUser,
  splitSelectedIds,
  toggleSplitSelect,
  handleConfirmSelection,
  setCurrentScreen,
  setSplitSelectedIds,
  setShares,
  setUserSharePercent,
  loading
}) => {
  // Since App.js filters out the currentUser, the renderer doesn't need to check for isSelf
  const contactRenderer = renderSplitContact(styles, currentUser, splitSelectedIds, toggleSplitSelect);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSplitSelectedIds([]);
          setShares([]);
          // Reset weights to default (100) on exit
          setUserSharePercent(100); 
          setCurrentScreen('home');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Split Check</Text>
      <Text style={styles.subtitle}>Select people to split with (you are the payer)</Text>
      <FlatList
        data={users}
        renderItem={contactRenderer}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No other users available to split with.</Text>}
      />
      <TouchableOpacity
        style={[
          styles.confirmButton, 
          { 
            backgroundColor: splitSelectedIds.length > 0 ? '#FF9800' : '#ccc',
            marginTop: 20 
          }
        ]}
        onPress={handleConfirmSelection}
        disabled={splitSelectedIds.length === 0}
        activeOpacity={0.7}
      >
        <Text style={styles.confirmButtonText}>
          Confirm Selection ({splitSelectedIds.length} selected)
        </Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />}
    </View>
  );
};

export default memo(SplitSelectionScreen);
