import React, { useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
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
      name: `${currentUser.name} (Vi)`, 
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
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container} 
        keyboardShouldPersistTaps="always" 
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          paddingBottom: 120, // NEW: Add padding to prevent content from being obscured by fixed buttons
          flexGrow: 1 
        }}
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
          <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>Razdeli plačilo</Text>
        
        {/* Total Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountdetailLabel}>Skupaj plačilo (€):</Text>
          <TextInput
            style={styles.amountInput}
            value={splitAmountInput}
            onChangeText={setSplitAmountInput}
            keyboardType="decimal-pad"
            placeholder="10"
            placeholderTextColor="#999"
            selectTextOnFocus={false}
            contextMenuHidden={true}
            blurOnSubmit={false}
            keyboardShouldPersistTaps="always"
            autoFocus={true}
            returnKeyType="done"
          />
        </View>

        {allPeople.map((item) => (
          <View style={styles.personRow} key={item.id.toString()}>
            <View style={styles.cell}>
              <View>
                <Text style={[
                  styles.name, 
                  item.isUser && { fontSize: 22, fontWeight: '800' }
                ]}>
                  {item.name} 
                </Text>
              </View>
              <Text 
                style={styles.amountdetailLabelRight}
                selectable={false}
              >
                Prispeva: {item.amount.toFixed(2)}€
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <SliderComponent
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={item.weight}
                onValueChange={(value) => 
                  item.isUser 
                    ? handleUserShareChange(value)
                    : handleOtherShareChange(item.shareIndex, value)
                }
                minimumTrackTintColor="green"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#0d6b0fff"
                step={1}
              />
            </View>
          </View>
        ))}
        
        {loading && <ActivityIndicator size="large" color="#61dafb" style={styles.loadingSpinner} />}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* NEW: Fixed buttons container at the bottom of the screen */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
      }}>
        <View style={styles.container_splitconfirm_buttons}>  
          <TouchableOpacity
            style={styles.splitconfirm_button}
            onPress={equalizeShares}
            activeOpacity={0.7}
          >
            <Text style={[styles.confirmButtonText, {alignSelf: 'center', position: 'absolute', right: '20%'}]}>Razdeli</Text>
            <Image source={require('../assets/equalsplit.png')} style={[styles.icon, {alignSelf: 'center', position: 'absolute', left: '20%'}]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.splitconfirm_button}
            onPress={handleConfirmSplit}
            disabled={loading || total <= 0 || totalWeight === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.confirmButtonText, {alignSelf: 'center', position: 'absolute', right: '20%'}]}>Pošlji</Text>
            <Image source={require('../assets/money.png')} style={[styles.icon, {alignSelf: 'center', position: 'absolute', left: '20%'}]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default memo(SplitConfirmScreen);