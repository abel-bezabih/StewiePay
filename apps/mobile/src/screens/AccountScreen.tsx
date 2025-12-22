import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieText } from '../components/stewiepay/StewieText';
import { GlassCard } from '../components/modern/GlassCard';
import { BackButton } from '../components/navigation/BackButton';
import { EditProfileModal } from '../components/account/EditProfileModal';
import { ChangePasswordModal } from '../components/account/ChangePasswordModal';
import { SecuritySettingsModal } from '../components/account/SecuritySettingsModal';
import { NotificationsAPI } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AccountScreenProps {
  navigation: any;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [accountStats, setAccountStats] = useState({
    totalCards: 0,
    totalTransactions: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    // Load notification preferences from user data if available
    if (user && (user as any).notificationPreferences) {
      const prefs = (user as any).notificationPreferences;
      setNotificationsEnabled(prefs.transactions !== false);
      setEmailNotifications(prefs.email !== false);
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
          },
        },
      ]
    );
  };

  const handleNotificationToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(value);
    try {
      await NotificationsAPI.updatePreferences({ transactions: value });
    } catch (error) {
      // Revert on error
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const handleEmailNotificationToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmailNotifications(value);
    try {
      await NotificationsAPI.updatePreferences({ email: value });
    } catch (error) {
      // Revert on error
      setEmailNotifications(!value);
      Alert.alert('Error', 'Failed to update email notification preferences');
    }
  };

  const MenuItem = ({
    icon,
    label,
    value,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.menuItem}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon as any}
            size={22}
            color={StewiePayBrand.colors.primary}
          />
        </View>
        <View style={styles.menuItemText}>
          <StewieText variant="bodyLarge" color="primary" weight="medium">
            {label}
          </StewieText>
          {value && (
            <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
              {value}
            </StewieText>
          )}
        </View>
      </View>
      {rightComponent ||
        (showArrow && onPress && (
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={StewiePayBrand.colors.textMuted}
          />
        ))}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)}>
          <LinearGradient
            colors={StewiePayBrand.colors.gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <StewieText
                  variant="displaySmall"
                  color="primary"
                  weight="black"
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </StewieText>
              </View>
              <StewieText
                variant="headlineMedium"
                color="primary"
                weight="bold"
                style={{ marginTop: StewiePayBrand.spacing.md }}
              >
                {user?.name || 'User'}
              </StewieText>
              <StewieText
                variant="bodyMedium"
                color="primary"
                style={{ marginTop: StewiePayBrand.spacing.xs, opacity: 0.9 }}
              >
                {user?.email || 'user@stewiepay.local'}
              </StewieText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Account Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.section}
        >
          <GlassCard elevated intensity={35} style={styles.card}>
            <StewieText
              variant="labelLarge"
              color="muted"
              style={styles.sectionTitle}
            >
              Account Overview
            </StewieText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <StewieText variant="headlineSmall" color="primary" weight="bold">
                  {accountStats.totalCards}
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={styles.statLabel}>
                  Cards
                </StewieText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <StewieText variant="headlineSmall" color="primary" weight="bold">
                  {accountStats.totalTransactions}
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={styles.statLabel}>
                  Transactions
                </StewieText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <StewieText variant="headlineSmall" color="primary" weight="bold">
                  ETB {accountStats.totalSpent.toLocaleString()}
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={styles.statLabel}>
                  Total Spent
                </StewieText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Account Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.section}
        >
          <GlassCard elevated intensity={35} style={styles.card}>
            <StewieText
              variant="labelLarge"
              color="muted"
              style={styles.sectionTitle}
            >
              Account
            </StewieText>
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              value={user?.email}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEditProfile(true);
              }}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="key-outline"
              label="Change Password"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowChangePassword(true);
              }}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Security"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSecurity(true);
              }}
            />
          </GlassCard>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.section}
        >
          <GlassCard elevated intensity={35} style={styles.card}>
            <StewieText
              variant="labelLarge"
              color="muted"
              style={styles.sectionTitle}
            >
              Preferences
            </StewieText>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={StewiePayBrand.colors.primary}
                  />
                </View>
                <View style={styles.menuItemText}>
                  <StewieText variant="bodyLarge" color="primary" weight="medium">
                    Push Notifications
                  </StewieText>
                  <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                    Transaction alerts and updates
                  </StewieText>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{
                  false: StewiePayBrand.colors.surfaceVariant,
                  true: StewiePayBrand.colors.primary + '40',
                }}
                thumbColor={
                  notificationsEnabled
                    ? StewiePayBrand.colors.primary
                    : StewiePayBrand.colors.textMuted
                }
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={StewiePayBrand.colors.primary}
                  />
                </View>
                <View style={styles.menuItemText}>
                  <StewieText variant="bodyLarge" color="primary" weight="medium">
                    Email Notifications
                  </StewieText>
                  <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                    Weekly summaries and updates
                  </StewieText>
                </View>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={handleEmailNotificationToggle}
                trackColor={{
                  false: StewiePayBrand.colors.surfaceVariant,
                  true: StewiePayBrand.colors.primary + '40',
                }}
                thumbColor={
                  emailNotifications
                    ? StewiePayBrand.colors.primary
                    : StewiePayBrand.colors.textMuted
                }
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Support Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.section}
        >
          <GlassCard elevated intensity={35} style={styles.card}>
            <StewieText
              variant="labelLarge"
              color="muted"
              style={styles.sectionTitle}
            >
              Support
            </StewieText>
            <MenuItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Help Center', 'Help center coming soon!');
              }}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="document-text-outline"
              label="Terms & Privacy"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Terms & Privacy', 'Terms and privacy policy coming soon!');
              }}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="information-circle-outline"
              label="About"
              value="Version 0.0.1"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  'About StewiePay',
                  'StewiePay v0.0.1\n\nA modern payment card management platform.'
                );
              }}
            />
          </GlassCard>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          style={styles.section}
        >
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={StewiePayBrand.colors.error}
              style={{ marginRight: StewiePayBrand.spacing.sm }}
            />
            <StewieText variant="bodyLarge" color="error" weight="medium">
              Sign Out
            </StewieText>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: StewiePayBrand.spacing['2xl'] }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onUpdate={() => {
          // Profile updated, refresh if needed
        }}
      />
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          // Password changed successfully
        }}
      />
      <SecuritySettingsModal
        visible={showSecurity}
        onClose={() => setShowSecurity(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: StewiePayBrand.spacing.xl,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: StewiePayBrand.spacing['2xl'],
    paddingHorizontal: StewiePayBrand.spacing.lg,
    borderBottomLeftRadius: StewiePayBrand.radius['3xl'],
    borderBottomRightRadius: StewiePayBrand.radius['3xl'],
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    marginBottom: StewiePayBrand.spacing.md,
  },
  card: {
    padding: 0,
  },
  sectionTitle: {
    padding: StewiePayBrand.spacing.md,
    paddingBottom: StewiePayBrand.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingBottom: StewiePayBrand.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing.md,
  },
  statDivider: {
    width: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginVertical: StewiePayBrand.spacing.sm,
  },
  statLabel: {
    marginTop: StewiePayBrand.spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: StewiePayBrand.radius.md,
    backgroundColor: StewiePayBrand.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: StewiePayBrand.spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginLeft: StewiePayBrand.spacing.md + 40 + StewiePayBrand.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: StewiePayBrand.spacing.md,
    borderRadius: StewiePayBrand.radius.lg,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.error + '40',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});
