import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationsAPI } from '../api/client';
import { useAuth } from './AuthContext';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  })
});

interface NotificationContextType {
  expoPushToken: string | null;
  registerForPushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user } = useAuth();

  const registerForPushNotifications = async () => {
    try {
      // Skip in Expo Go - push notifications require a development build
      if (__DEV__) {
        // Check if we're in Expo Go (no projectId available)
        try {
          // Request permissions
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus !== 'granted') {
            if (__DEV__) {
              console.log('Push notification permissions not granted');
            }
            return;
          }

          // Try to get push token - this will fail in Expo Go without projectId
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Optional, only needed for Expo Go
          });

          setExpoPushToken(token.data);

          // Register token with backend
          if (user) {
            try {
              await NotificationsAPI.registerToken(token.data);
            } catch (e) {
              if (__DEV__) {
                console.error('Failed to register push token:', e);
              }
            }
          }
        } catch (e: any) {
          // Silently fail in Expo Go - notifications don't work without development build
          if (__DEV__ && !e?.message?.includes('projectId')) {
            console.warn('Push notifications not available in Expo Go. Use a development build for full functionality.');
          }
        }
      }
    } catch (e) {
      // Silently handle errors - notifications are optional
      if (__DEV__) {
        console.warn('Push notifications not available:', e);
      }
    }
  };

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      // Handle notification tap - navigate to relevant screen
      const data = response.notification.request.content.data;
      if (data?.type === 'transaction') {
        // Navigate to transaction detail
      } else if (data?.type === 'limit_warning' || data?.type === 'limit_exceeded') {
        // Navigate to card detail
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, registerForPushNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

