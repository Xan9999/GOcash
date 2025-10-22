import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import styles from '../Styles';
import { renderSplitContact } from './Renderers';

const SplitSelectionScreen = ({
  users,
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
  const contactRenderer = renderSplitContact(styles, currentUser, splitSelectedIds, toggleSplitSelect);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSplitSelectedIds([]);
          setShares([]);
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

export default SplitSelectionScreen;
