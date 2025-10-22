import React, { useState, memo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, Platform, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import styles from '../Styles'; 
const fakeQrPlaceholderImage = require('../assets/Example_QR_code.png'); 
const INITIAL_TIMEOUT_SECONDS = 30;

// Visual constants
const RADIUS = 40;           // outer radius of the circle
const BORDER_WIDTH = 5;
const SIZE = RADIUS * 2;

////////////////////////////////////////////////////////////////////////////////
// Animated SVG countdown circle (smooth radial wipe)
////////////////////////////////////////////////////////////////////////////////
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CountdownCircle = memo(({ timeLeft, totalTime, isActive }) => {
  // animated progress 0 -> 1 (0 = full circle visible, 1 = fully wiped)
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animation & start when activated
    if (isActive) {
      // ensure at 0 then animate to 1 over totalTime seconds
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: totalTime * 1000,
        useNativeDriver: false, // strokeDashoffset isn't supported by native driver
      }).start();
    } else {
      // stop and reset
      progress.stopAnimation();
      progress.setValue(0);
    }

    // cleanup if the component unmounts
    return () => {
      progress.stopAnimation();
    };
  }, [isActive, totalTime, progress]);

  // Compute properties for stroke dash calculations
  // Use radius of the center of stroke:
  const strokeRadius = RADIUS - BORDER_WIDTH / 2;
  const circumference = 2 * Math.PI * strokeRadius;

  // strokeDashoffset should go from 0 -> circumference (so arc disappears)
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  // Center container
  return (
    <View style={{ width: SIZE, height: SIZE, justifyContent: 'center', alignItems: 'center' }}>
      {/* SVG with background (gray) circle and animated green arc */}
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background circle (stationary gray ring) */}
        <Circle
          cx={RADIUS}
          cy={RADIUS}
          r={strokeRadius}
          stroke="#ddd"
          strokeWidth={BORDER_WIDTH}
          fill="transparent"
          opacity={0.6}
        />
        {/* Animated green arc */}
        <AnimatedCircle
          cx={RADIUS}
          cy={RADIUS}
          r={strokeRadius}
          stroke="#4CAF50"
          strokeWidth={BORDER_WIDTH}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${RADIUS} ${RADIUS})`} // start at 12 o'clock
        />
      </Svg>

      {/* Number overlay */}
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
          {timeLeft}
        </Text>
      </View>
    </View>
  );
});

////////////////////////////////////////////////////////////////////////////////
// Main screen (only small usage change — pass isActive prop)
////////////////////////////////////////////////////////////////////////////////
const ReceiveQrScreen = ({
  amountInput: initialAmountInput, 
  currentUser,
  setCurrentScreen,
}) => {
  const [showQr, setShowQr] = useState(false);
  const [localAmount, setLocalAmount] = useState(initialAmountInput);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIMEOUT_SECONDS);
  const timerRef = useRef(null);

  // Clear timer on unmount
  useEffect(() => () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Timer logic (counts by integers; circle animation is smooth and independent)
  useEffect(() => {
    if (showQr) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setCurrentScreen('home'); 
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [showQr, setCurrentScreen]);

  const handleGenerateQr = () => {
    const amount = parseFloat(String(localAmount).replace(',', '.')) || 0;
    if (amount <= 0 || isNaN(amount)) {
      console.error('ERROR: Enter a positive amount.');
      return;
    }
    setTimeLeft(INITIAL_TIMEOUT_SECONDS);
    setShowQr(true);
  };

  const titleMarginTop = showQr ? (Platform.OS === 'web' ? 20 : 50) : (Platform.OS === 'web' ? 50 : 80);

  return (
    <ScrollView 
      style={styles.container} 
      keyboardShouldPersistTaps="always" 
      contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
      key="receive-qr-scroll" 
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (showQr && timerRef.current) {
             clearInterval(timerRef.current);
          }
          setCurrentScreen('contacts');
        }}
        activeOpacity={0.7}
      >
        <Image source={require('../assets/backarrow.png')} style={styles.headerIcon} />
      </TouchableOpacity>

      <Text style={[styles.title, { marginTop: titleMarginTop }]}>
        {showQr ? 'QR Koda je aktivna' : 'Ustvari QR Kodo za Prejem'}
      </Text>

      {!showQr && (
        <>          
          <View style={styles.amountContainer}>
            <Text style={styles.amountdetailLabel}>Znesek (€):</Text>
            <TextInput
              style={styles.amountInput}
              value={localAmount}
              onChangeText={(text) => {
                setLocalAmount(text);
                setShowQr(false);
              }}
              keyboardType="decimal-pad"
              placeholder="10"
              placeholderTextColor="#999"
              selectTextOnFocus={false}
              contextMenuHidden={true}
              blurOnSubmit={false}
              keyboardShouldPersistTaps="always"
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleGenerateQr}
            />
          </View>
        </>
      )}

      {!showQr && (
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: '#4CAF50' }
          ]}
          onPress={handleGenerateQr}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>Generiraj QR Kodo</Text>
        </TouchableOpacity>
      )}

      {showQr && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={styles.subtitle}>Skeniraj za plačilo €{parseFloat(String(localAmount).replace(',', '.') || 0).toFixed(2)}</Text>
          
          <Image 
            source={fakeQrPlaceholderImage} 
            style={{ width: 300, height: 300, marginVertical: 20 }} 
            resizeMode="contain" 
          />
          
          {/* Smooth animated circle — pass isActive so it starts/stops when QR is shown */}
          <CountdownCircle 
            timeLeft={timeLeft} 
            totalTime={INITIAL_TIMEOUT_SECONDS}
            isActive={showQr}
          />
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default memo(ReceiveQrScreen);
