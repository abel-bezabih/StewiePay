import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/design-system';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { LoginScreenStewie } from '../screens/LoginScreenStewie';
import { SignupScreenStewie } from '../screens/SignupScreenStewie';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useOnboarding } from '../contexts/OnboardingContext';
import { HomeScreenStewie } from '../screens/HomeScreenStewie';
import { CardsScreenStewie } from '../screens/CardsScreenStewie';
import { CardDetailScreen } from '../screens/CardDetailScreen';
import { CreateCardScreenStewie } from '../screens/CreateCardScreenStewie';
import { TransactionsScreenStewie } from '../screens/TransactionsScreenStewie';
import { AnalyticsScreenStewie } from '../screens/AnalyticsScreenStewie';
import { SubscriptionsScreenStewie } from '../screens/SubscriptionsScreenStewie';
import { BudgetsScreenStewie } from '../screens/BudgetsScreenStewie';
import { TopUpScreenStewie } from '../screens/TopUpScreenStewie';
import { MoreScreen } from '../screens/MoreScreen';
import { AccountScreen } from '../screens/AccountScreen';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CardDetail: { cardId: string };
  CreateCard: { orgId?: string };
  Analytics: undefined;
  Budgets: undefined;
  Subscriptions: undefined;
  TopUp: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const navigation = useNavigation<any>();
  
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: StewiePayBrand.colors.background, // Gray background
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 88 : 72,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
            paddingHorizontal: StewiePayBrand.spacing.md,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            ...StewiePayBrand.shadows.lg,
            elevation: 8,
            marginHorizontal: StewiePayBrand.spacing.sm,
            marginBottom: Platform.OS === 'ios' ? 8 : 4,
            position: 'absolute',
          },
          tabBarActiveTintColor: StewiePayBrand.colors.primary,
          tabBarInactiveTintColor: '#999999', // Light gray for inactive tabs
          tabBarIconStyle: { marginTop: 4 },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
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
            tabBarLabel: 'Home'
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreenStewie}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Analytics',
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
          name="Cards"
          component={CardsScreenStewie}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Cards'
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            tabBarLabel: 'More'
          }}
        />
      </Tab.Navigator>
      
      {/* Floating Action Button (FAB) */}
      <View style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 50 : 42,
        alignSelf: 'center',
        zIndex: 1000,
      }}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('TopUp');
          }}
          activeOpacity={0.8}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: StewiePayBrand.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 12,
          }}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AuthStack = createNativeStackNavigator();
const AuthNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' } // Transparent to show FintechBackground
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreenStewie} />
      <AuthStack.Screen name="Signup" component={SignupScreenStewie} />
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
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' } // Transparent to show FintechBackground
      }}
    >
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="CreateCard" component={CreateCardScreenStewie} />
      <Stack.Screen name="Analytics" component={AnalyticsScreenStewie} />
      <Stack.Screen name="Budgets" component={BudgetsScreenStewie} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreenStewie} />
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






