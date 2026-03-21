import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/design-system';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { LoginScreenStewie } from '../screens/LoginScreenStewie';
import { SignupScreenStewie } from '../screens/SignupScreenStewie';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { VerifyEmailPendingScreen } from '../screens/VerifyEmailPendingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useOnboarding } from '../contexts/OnboardingContext';
import { HomeScreenStewie } from '../screens/HomeScreenStewie';
import { CardsScreenStewie } from '../screens/CardsScreenStewie';
import { CardDetailScreen } from '../screens/CardDetailScreen';
import { CreateCardScreenStewie } from '../screens/CreateCardScreenStewie';
import { EditCardLimitsScreen } from '../screens/EditCardLimitsScreen';
import { KycVerificationScreen } from '../screens/KycVerificationScreen';
import { TransactionsScreenStewie } from '../screens/TransactionsScreenStewie';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { ActivitiesScreenStewie } from '../screens/ActivitiesScreenStewie';
import { TopUpScreenStewie } from '../screens/TopUpScreenStewie';
import { MoreScreen } from '../screens/MoreScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { CustomTabBar } from '../components/navigation/CustomTabBar';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CardDetail: { cardId: string };
  EditCardLimits: { cardId: string; limits: { limitDaily?: number; limitMonthly?: number; limitPerTxn?: number } };
  CreateCard: { orgId?: string };
  TransactionDetail: { transaction: any };
  KycVerification: undefined;
  Activities: undefined;
  TopUp: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const hasAutoPromptedKyc = useRef(false);

  useEffect(() => {
    if (!user) return;
    const status = (user as any)?.kycStatus || 'PENDING';
    if (status === 'PENDING' && !hasAutoPromptedKyc.current) {
      hasAutoPromptedKyc.current = true;
      navigation.navigate('KycVerification');
    }
  }, [navigation, user]);
  
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar, using custom one
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreenStewie}
          options={{
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={size} 
                color={color} 
              />
            ),
            tabBarLabel: 'Home',
            tabBarItemStyle: {
              paddingHorizontal: 4, // Minimal spacing for left group
            },
          }}
        />
        <Tab.Screen
          name="Cards"
          component={CardsScreenStewie}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Cards',
            tabBarItemStyle: {
              paddingHorizontal: 4, // Minimal spacing for left group
            },
          }}
        />
        <Tab.Screen
          name="TopUp"
          component={TopUpScreenStewie}
          options={{
            tabBarIcon: () => null,
            tabBarLabel: '',
            tabBarButton: () => null, // Hide from tab bar, we'll add FAB instead
          }}
        />
        <Tab.Screen
          name="Activities"
          component={ActivitiesScreenStewie}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Activities',
            tabBarItemStyle: {
              paddingHorizontal: 8, // Right group spacing
            },
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
            tabBarLabel: 'More',
            tabBarItemStyle: {
              paddingHorizontal: 8, // Right group spacing
            },
          }}
        />
        </Tab.Navigator>
    </View>
  );
};

const AuthStack = createNativeStackNavigator();
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' } // Transparent to show FintechBackground
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreenStewie} />
      <AuthStack.Screen name="Signup" component={SignupScreenStewie} />
      <AuthStack.Screen name="VerifyEmailPending" component={VerifyEmailPendingScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return <>{user ? children : <AuthNavigator />}</>;
};

const MainScreen = () => {
  return (
    <RequireAuth>
      <TabNavigator />
    </RequireAuth>
  );
};

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' } // Transparent to show FintechBackground
      }}
    >
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="EditCardLimits" component={EditCardLimitsScreen} />
      <Stack.Screen name="CreateCard" component={CreateCardScreenStewie} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="KycVerification" component={KycVerificationScreen} />
      <Stack.Screen name="Activities" component={ActivitiesScreenStewie} />
      <Stack.Screen 
        name="TopUp" 
        component={TopUpScreenStewie}
        options={{
          presentation: 'modal',
          animation: 'fade',
          animationDuration: 0, // We handle animation in ModalTopUpWrapper
        }}
      />
      <Stack.Screen name="Account" component={AccountScreen} />
    </Stack.Navigator>
  );
};






