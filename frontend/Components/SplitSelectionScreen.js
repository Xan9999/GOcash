import React, { memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import styles from '../Styles';

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
  loading,
  groups,
  handleGroupSelection
}) => {

  // Filter out the current user from the list
  const listData = [
    ...groups,
    ...users.filter(u => u.id !== currentUser.id)
  ];

  const renderItem = ({ item }) => {
    // Determine if this is a group or a user for proper display/action
    const isGroup = item.member_ids !== undefined;
    
    if (isGroup) {
      // --- Group Rendering ---
      // Get member names for display
      const memberNames = item.member_ids
        .map(id => users.find(u => u.id === id)?.name)
        .filter(name => name)
        .join(', ');

      return (
        <TouchableOpacity
          style={[styles.row, styles.groupRow]}
          onPress={() => handleGroupSelection(item.member_ids)}
          activeOpacity={0.7}
        >
          <View style={styles.userInfo}>
            {/* Use groupRowText style for clearer group differentiation */}
            <Text style={styles.groupRowText}>{item.name}</Text>
            <Text style={styles.label}>{memberNames}</Text>
          </View>
          {/* Action text removed as requested */}
        </TouchableOpacity>
      );
    } else {
      // --- Individual User Rendering ---
      if (item.id === currentUser.id) return null; 

      const isSelected = splitSelectedIds.includes(item.id);
      
      return (
        <TouchableOpacity
          style={[styles.row, isSelected && styles.splitSelectedRow]}
          onPress={() => toggleSplitSelect(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.label}>{item.email}</Text>
          </View>
          {/* Action text removed as requested */}
        </TouchableOpacity>
      );
    }
  };
  
  const handleCancel = () => {
    setSplitSelectedIds([]);
    setShares([]);
    setUserSharePercent(50);
    setCurrentScreen('home');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.backButton, styles.backButtonPadded]} // Apply new padding style
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Cancel Split</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Split a Check</Text>
      <View style={styles.splitSelectHeader}>
        <Text style={styles.splitSelectTitle}>Select People & Groups</Text>
        <Text style={styles.splitSelectCount}>
          Selected: {splitSelectedIds.length} people (excluding you)
        </Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Footer with new button layout */}
      <View style={styles.splitSelectionFooter}>
        <TouchableOpacity
          style={[
            styles.confirmButton, 
            splitSelectedIds.length === 0 && styles.confirmButtonDisabled,
            styles.splitConfirmButton
          ]}
          onPress={() => handleConfirmSelection(splitSelectedIds)}
          disabled={splitSelectedIds.length === 0}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>Confirm Selection</Text>
        </TouchableOpacity>
        
        {/* NEW: Group Creation Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            styles.groupCreateButton,
            // Allow group creation even if no one is selected, but warn later.
            // splitSelectedIds.length === 0 && styles.confirmButtonDisabled
          ]}
          onPress={() => setCurrentScreen('group_create')}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(SplitSelectionScreen);
