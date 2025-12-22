import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { AppContent } from './src/components/AppInitializer';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { FintechBackground } from './src/components/FintechBackground';

export default function App() {
  return (
    <ErrorBoundary>
      <FintechBackground>
        <SafeAreaProvider>
          <OnboardingProvider>
            <AuthProvider>
              <NotificationProvider>
                <NavigationContainer
                  theme={{
                    dark: false,
                    colors: {
                      primary: '#5B21B6',
                      background: 'transparent',
                      card: 'transparent',
                      text: '#000000',
                      border: 'transparent',
                      notification: '#5B21B6',
                    },
                  }}
                >
                  <AppContent />
                  <StatusBar style="light" />
                </NavigationContainer>
              </NotificationProvider>
            </AuthProvider>
          </OnboardingProvider>
        </SafeAreaProvider>
      </FintechBackground>
    </ErrorBoundary>
  );
}


