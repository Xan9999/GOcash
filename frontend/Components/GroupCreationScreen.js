import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Image } from 'react-native';
import styles from '../Styles';

const GroupCreationScreen = ({
  currentUser,
  users,
  splitSelectedIds, // The IDs of the members already selected in the previous screen
  handleCreateGroup,
  setCurrentScreen,
  loading
}) => {
  const [groupName, setGroupName] = useState('');

  // Get names of selected users
  const selectedMemberNames = splitSelectedIds
    .map(id => users.find(u => u.id === id)?.name)
    .filter(name => name)
    .join(', ');

  const handleCreate = (redirectToSplitConfirm) => {
    if (!groupName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for the group.');
      return;
    }
    if (splitSelectedIds.length === 0) {
        Alert.alert('Missing Members', 'No members selected. Please select members from the previous screen.');
        return;
    }
    
    // We pass the currently selected IDs (which excludes the currentUser)
    handleCreateGroup(groupName.trim(), splitSelectedIds, redirectToSplitConfirm);
  };
  
  return (
    <ScrollView 
      style={styles.container} 
      keyboardShouldPersistTaps="always" 
      contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
      key="group-create-scroll" 
    >
      <TouchableOpacity
        style={[styles.backButton, styles.backButtonPadded]} // Apply new padding style
        onPress={() => setCurrentScreen('split')}
        activeOpacity={0.7}
      >
        <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
      </TouchableOpacity>
      
      <Text style={styles.title}>Ustvari skupino</Text>
      
      {/* Group Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.detailLabel}>Ime skupine:</Text>
        <TextInput
          style={styles.textInput}
          value={groupName}
          onChangeText={setGroupName}
          editable={!loading}
          autoCapitalize="words"
        />
      </View>

      {/* Selected Members Display */}
      <View style={styles.inputContainer}>
        <Text style={styles.detailLabel}>Člani:</Text>
        <Text style={styles.textInputDisplay}>
          {selectedMemberNames
            ? `${currentUser?.name}, ${selectedMemberNames}`
            : currentUser?.name || 'No members selected.'}
        </Text>
        <Text style={[styles.detailLabel, { color: 'red' }]}>
          {splitSelectedIds.length === 0 && "Please go back and select members."}
        </Text>
        <Text style={[styles.detailLabel, { color: 'red' }]}>
          {splitSelectedIds.length === 0 && "Please go back and select members."}
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.groupCreateActions}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: '#4CAF50', flex: 2 }]}
          onPress={() => handleCreate(true)}
          disabled={loading || splitSelectedIds.length === 0 || !groupName.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Razdeli račun in ustvari skupino</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: '#61dafb', flex: 1, marginLeft: 10 }]}
          onPress={() => handleCreate(false)}
          disabled={loading || splitSelectedIds.length === 0 || !groupName.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Shrani skupino</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <Text style={styles.loadingText}>Creating group...</Text>}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default memo(GroupCreationScreen);
