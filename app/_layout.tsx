import { CustomAlertProvider } from '@/components/CustomAlert';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import 'react-native-reanimated';

// Keep the native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

function AppSplash({ onFinish }: { onFinish: () => void }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.6)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.8)).current;
  const ringScale2 = useRef(new Animated.Value(0.6)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.6)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing rings
    const pulseRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.6, duration: 1200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 0.6, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    setTimeout(() => {
      pulseRing(ringScale1, ringOpacity1, 0);
      pulseRing(ringScale2, ringOpacity2, 600);
    }, 400);

    // Text fade in
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 700,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Progress bar
    Animated.timing(progressWidth, {
      toValue: width * 0.55,
      duration: 2000,
      delay: 300,
      useNativeDriver: false,
    }).start();

    // Fade out and finish
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.splash, { opacity: screenOpacity }]}>
      {/* Dark gradient background layers */}
      <View style={styles.bgLayer1} />
      <View style={styles.bgLayer2} />
      <View style={styles.bgLayer3} />

      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Pulsing rings */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale1 }], opacity: ringOpacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          styles.ring2,
          { transform: [{ scale: ringScale2 }], opacity: ringOpacity2 },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name & tagline */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.appName}>DisproPago</Text>
        <Text style={styles.tagline}>Sistema de Punto de Venta</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>
      <Animated.Text style={[styles.loadingText, { opacity: textOpacity }]}>
        Iniciando sistema...
      </Animated.Text>

      {/* Bottom brand */}
      <Animated.Text style={[styles.brandText, { opacity: textOpacity }]}>
        Disprocar C.A.
      </Animated.Text>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setVisibilityAsync('hidden');
      } catch (e) {
        console.log('NavigationBar warning:', e);
      }
    }
    RNStatusBar.setHidden(true);
    // Hide the native splash immediately — our custom one takes over
    SplashScreen.hideAsync();
  }, []);

  if (!splashDone) {
    return <AppSplash onFinish={() => setSplashDone(true)} />;
  }

  return (
    <CustomAlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="sale" />
        <Stack.Screen name="sales" />
        <Stack.Screen name="buys" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="modal" />
      </Stack>
    </CustomAlertProvider>
  );
}

const LOGO_SIZE = Math.min(width, height) * 0.22;
const RING_SIZE = LOGO_SIZE * 1.8;

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#060B27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Background layers for depth
  bgLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A1045',
  },
  bgLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: '#0F1860',
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    opacity: 0.5,
  },
  bgLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#070D35',
    opacity: 0.8,
  },
  // Decorative color blobs
  blob1: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#1A237E',
    top: -width * 0.2,
    left: -width * 0.2,
    opacity: 0.4,
  },
  blob2: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: '#283593',
    bottom: -width * 0.15,
    right: -width * 0.15,
    opacity: 0.3,
  },
  blob3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#3949AB',
    top: height * 0.15,
    right: -40,
    opacity: 0.2,
  },
  // Pulsing rings around logo
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(100, 130, 255, 0.5)',
  },
  ring2: {
    width: RING_SIZE * 1.3,
    height: RING_SIZE * 1.3,
    borderRadius: (RING_SIZE * 1.3) / 2,
    borderColor: 'rgba(80, 110, 255, 0.3)',
  },
  // Logo
  logoContainer: {
    width: LOGO_SIZE + 24,
    height: LOGO_SIZE + 24,
    borderRadius: (LOGO_SIZE + 24) / 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#6677FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  // Text
  textBlock: {
    alignItems: 'center',
    marginTop: 32,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(100, 130, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(180, 195, 255, 0.75)',
    letterSpacing: 3,
    marginTop: 6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  // Progress
  progressTrack: {
    width: width * 0.55,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginTop: 40,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6677FF',
    borderRadius: 4,
    shadowColor: '#6677FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 11,
    color: 'rgba(180, 195, 255, 0.5)',
    letterSpacing: 2,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  brandText: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
