import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import 'react-native-reanimated';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Avoid calling NavigationBar methods if they produce warnings or are not supported
      try {
        NavigationBar.setVisibilityAsync('hidden');
      } catch (e) {
        console.log('NavigationBar warning:', e);
      }
    }
    // Hide top status bar
    RNStatusBar.setHidden(true);
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sale" />
        <Stack.Screen name="sales" />
        <Stack.Screen name="buys" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="modal" />
      </Stack>
    </>
  );
}
