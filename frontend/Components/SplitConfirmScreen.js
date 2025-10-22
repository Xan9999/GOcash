import React, { useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import SliderComponent from '@react-native-community/slider';
import styles from '../Styles';

const SplitConfirmScreen = ({
  currentUser,
  splitSelectedIds,
  users,
  splitAmountInput,
  setSplitAmountInput,
  shares, // This is now the array of WEIGHTS
  userSharePercent, // This is now the user's WEIGHT
  handleUserShareChange,
  handleOtherShareChange,
  handleConfirmSplit,
  equalizeShares,
  memoizedAmounts, // Contains proportional amounts and percentages
  loading,
  message,
  setCurrentScreen,
  setSplitSelectedIds,
  setShares,
  setUserSharePercent
}) => {
  if (splitSelectedIds.length === 0) {
    Alert.alert("Error", "No recipients selected for split. Returning to selection.");
    setCurrentScreen('split');
    return null;
  }

  const total = parseFloat(splitAmountInput) || 0;
  
  const { user: userAmount, others: otherAmounts, normalizedPercents } = memoizedAmounts;

  // Combine user and selected users with their calculated amounts and percentages
  const allPeople = useMemo(() => {
    // Current User data (Payer)
    const userIndex = 0;
    const people = [{ 
      name: `${currentUser.name} (You)`, 
      id: currentUser.id,
      isUser: true, 
      // Displayed percentage comes from memoizedAmounts
      percent: normalizedPercents[userIndex] || 0,
      amount: userAmount || 0,
      shareIndex: -1, // Custom index for user
      // Slider value comes from the raw WEIGHT state
      weight: userSharePercent
    }];

    // Selected Recipient data
    splitSelectedIds.forEach((id, shareIndex) => {
      const u = users.find(x => x.id === id);
      const percent = normalizedPercents[shareIndex + 1] || 0;
      const amount = otherAmounts[shareIndex] || 0;
      people.push({
        name: u?.name || 'Unknown User',
        id: id,
        isUser: false,
        percent: percent,
        amount: amount,
        shareIndex: shareIndex, // Corresponds to the index in the 'shares' array
        // Slider value comes from the raw WEIGHT state
        weight: shares[shareIndex]
      });
    });

    return people;
  }, [currentUser, splitSelectedIds, users, userAmount, otherAmounts, normalizedPercents, userSharePercent, shares]);

  const totalWeight = userSharePercent + shares.reduce((sum, w) => sum + w, 0);

  return (
    <ScrollView 
      style={styles.container} 
      keyboardShouldPersistTaps="always" 
      contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
      key="split-confirm-scroll" 
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
      <Text style={styles.title}>Split Check</Text>
      
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
        style={[styles.sendButton, { width: '100%', alignSelf: 'center', marginBottom: 20, marginTop: 10 }]}
        onPress={equalizeShares}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Equal Split</Text>
      </TouchableOpacity>
      
      {/* Total Weight Indicator (REMOVED) */}
      {/* Share List */}
      {allPeople.map((item) => (
        <View style={styles.shareRow} key={item.id.toString()}>
          <View style={styles.cell}>
            <Text style={[
              styles.name, 
              item.isUser && { fontSize: 22, fontWeight: '800' }
            ]}>
              {item.name} 
            </Text>
            <Text 
              style={[styles.label, { marginTop: 5, color: '#282c34', fontSize: 16 }]} 
              selectable={false}
            >
              Pays: €{item.amount.toFixed(2)}
            </Text>
            {/* Percentage/Weight Indicator (REMOVED) */}
          </View>
          <View style={styles.sliderContainer}>
            <SliderComponent
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              // Bind value to the raw WEIGHT state
              value={item.weight}
              onValueChange={(value) => 
                item.isUser 
                  ? handleUserShareChange(value)
                  : handleOtherShareChange(item.shareIndex, value)
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
          { backgroundColor: '#4CAF50', marginTop: 20 }
        ]}
        onPress={handleConfirmSplit}
        disabled={loading || total <= 0 || totalWeight === 0}
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

export default memo(SplitConfirmScreen);
