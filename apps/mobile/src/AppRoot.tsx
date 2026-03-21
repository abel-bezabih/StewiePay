import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppContent } from './components/AppInitializer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FintechBackground } from './components/FintechBackground';

function AppRoot() {
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

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1)
  });
}

export default sentryDsn ? Sentry.wrap(AppRoot) : AppRoot;
