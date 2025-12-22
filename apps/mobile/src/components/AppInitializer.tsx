import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RootNavigator } from '../navigation';
import { SplashScreen } from './SplashScreen';
import { StewiePayBrand } from '../brand/StewiePayBrand';

/**
 * AppContent - Shows splash screen and waits for auth initialization
 * 
 * This component must be wrapped by AuthProvider in the parent
 */
export const AppContent: React.FC = () => {
  const [splashVisible, setSplashVisible] = useState(true);
  const { initializing } = useAuth();

  // Show splash screen until it finishes AND auth is initialized
  if (splashVisible || initializing) {
    return <SplashScreen onFinish={() => setSplashVisible(false)} />;
  }

  // Once splash is done and auth is initialized, show the app
  return <RootNavigator />;
};

