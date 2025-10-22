import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
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
        <Text style={styles.backText}>← Back to Selection</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Create New Group</Text>
      
      {/* Group Name Input */}
      <View style={styles.inputContainer}>
        {/* Use the new, more visible groupLabel style */}
        <Text style={styles.groupLabel}>Group Name:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Dinner Crew, Gym Buddies"
          value={groupName}
          onChangeText={setGroupName}
          editable={!loading}
          autoCapitalize="words"
        />
      </View>

      {/* Selected Members Display */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Members Selected (Excluding You):</Text>
        <Text style={styles.textInputDisplay}>
          {selectedMemberNames || 'No members selected.'}
        </Text>
        <Text style={[styles.label, { marginTop: 10 }]}>
          {currentUser?.name} (You) is automatically included in the split.
        </Text>
        <Text style={[styles.label, { color: 'red' }]}>
          {splitSelectedIds.length === 0 && "Please go back and select members."}
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.groupCreateActions}>
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: '#4CAF50', flex: 2 }]}
          onPress={() => handleCreate(true)}
          disabled={loading || splitSelectedIds.length === 0 || !groupName.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Split & Create Group</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: '#61dafb', flex: 1, marginLeft: 10 }]}
          onPress={() => handleCreate(false)}
          disabled={loading || splitSelectedIds.length === 0 || !groupName.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Save Group</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <Text style={styles.loadingText}>Creating group...</Text>}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default memo(GroupCreationScreen);
