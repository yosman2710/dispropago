import { CustomAlertProvider } from '@/components/CustomAlert';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

// Keep the native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setVisibilityAsync('hidden');
      } catch (e) {
        console.log('NavigationBar warning:', e);
      }
    }
    RNStatusBar.setHidden(true);
    // Hide the native splash immediately, skipping heavy JS animations
    SplashScreen.hideAsync();
  }, []);

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
