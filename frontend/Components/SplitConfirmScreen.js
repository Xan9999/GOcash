import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native';
import SliderComponent from '@react-native-community/slider';
import styles from '../Styles';

const SplitConfirmScreen = ({
  currentUser,
  splitSelectedIds,
  users,
  splitAmountInput,
  setSplitAmountInput,
  shares,
  userSharePercent,
  handleUserShareChange,
  handleOtherShareChange,
  handleConfirmSplit,
  equalizeShares,
  memoizedAmounts,
  loading,
  message,
  setCurrentScreen,
  setSplitSelectedIds,
  setShares,
  setUserSharePercent
}) => {
  if (splitSelectedIds.length === 0) {
    // This handles the edge case if state gets corrupted or someone navigates back
    Alert.alert("Error", "No recipients selected for split. Returning to selection.");
    setCurrentScreen('split');
    return null;
  }

  const total = parseFloat(splitAmountInput) || 0;
  const totalPercent = userSharePercent + shares.reduce((sum, p) => sum + p, 0);
  const isExact = Math.abs(totalPercent - 100) < 0.01;

  const selectedUsersWithAmounts = useMemo(() => 
    splitSelectedIds.map((id, idx) => ({
      ...users.find(u => u.id === id),
      id: id,
      isUser: false,
      percent: shares[idx] || 0,
      amount: memoizedAmounts.others[idx] || 0
    })).filter(Boolean),
  [splitSelectedIds, users, memoizedAmounts.others, shares]);

  const totalOwed = selectedUsersWithAmounts.reduce((sum, u) => sum + u.amount, 0);
  // Your net is your total share minus the total requested from others
  const yourNet = memoizedAmounts.user - totalOwed;

  const allPeople = useMemo(() => [
    { 
      name: currentUser.name, 
      isUser: true, 
      percent: userSharePercent, 
      amount: memoizedAmounts.user,
      net: yourNet,
      id: currentUser.id
    },
    ...selectedUsersWithAmounts
  ], [currentUser, userSharePercent, memoizedAmounts.user, yourNet, selectedUsersWithAmounts]);

  return (
    <ScrollView 
      style={styles.container} 
      keyboardShouldPersistTaps="always" 
      contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSplitSelectedIds([]);
          setShares([]);
          setUserSharePercent(100);
          setCurrentScreen('split');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Back to Selection</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Confirm Split</Text>
      <Text style={styles.subtitle}>Enter total bill and adjust shares (Total %: {totalPercent.toFixed(0)}%)</Text>

      {/* Total Input */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total Bill (€):</Text>
        <TextInput
          style={styles.amountInput}
          value={splitAmountInput}
          onChangeText={setSplitAmountInput}
          keyboardType="decimal-pad"
          placeholder="30.00"
          placeholderTextColor="#999"
          selectTextOnFocus={false}
          contextMenuHidden={true}
          blurOnSubmit={false}
          keyboardShouldPersistTaps="always"
          autoFocus={true}
          returnKeyType="done"
        />
      </View>

      {/* Equalize Button */}
      <TouchableOpacity
        style={[styles.sendButton, { width: '100%', alignSelf: 'center', marginBottom: 10 }]}
        onPress={equalizeShares}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Equal Split</Text>
      </TouchableOpacity>

      {/* Share Preview */}
      <Text style={[styles.subtitle, { marginTop: 10, marginBottom: 10 }]}>Share Preview:</Text>
      
      {allPeople.map((item, index) => (
        <View style={styles.shareRow} key={item.id.toString()}>
          <View style={styles.cell}>
            <Text style={[
              styles.name, 
              item.isUser && { fontSize: 22, fontWeight: '800' }
            ]}>
              {item.name} {item.isUser ? '(You)' : ''}
            </Text>
            <Text 
              style={[styles.label, { marginTop: 5 }]} 
              selectable={false}
            >
              {item.isUser 
                ? `Total Share: €${item.amount.toFixed(2)} | Net: €${item.net.toFixed(2)}` 
                : `Pays: €${item.amount.toFixed(2)}`
              }
            </Text>
            <Text style={{fontSize: 14, color: '#FF9800', marginTop: 4 }}>
                {item.percent.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <SliderComponent
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={item.percent}
              onValueChange={(value) => 
                item.isUser 
                  ? handleUserShareChange(value)
                  : handleOtherShareChange(index - 1, value)
              }
              minimumTrackTintColor="#FF9800"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#FF9800"
              step={1}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[
          styles.confirmButton, 
          { backgroundColor: isExact ? '#4CAF50' : '#FF9800', marginTop: 20 }
        ]}
        onPress={handleConfirmSplit}
        disabled={loading || total <= 0}
        activeOpacity={0.7}
      >
        <Text style={styles.confirmButtonText}>Create Split Requests</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default SplitConfirmScreen;
