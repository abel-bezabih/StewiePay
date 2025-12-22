import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { GlassCard } from '../components/modern/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import Animated, { FadeIn } from 'react-native-reanimated';

interface MoreScreenProps {
  navigation: any;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <GlassCard elevated intensity={35} style={styles.card}>
        <StewieText variant="labelLarge" color="muted" style={styles.sectionTitle}>
          {title}
        </StewieText>
        {children}
      </GlassCard>
    </View>
  );

  const MenuItem = ({
    icon,
    label,
    onPress,
    badge,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    badge?: number;
  }) => (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.menuItem}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={22} color={StewiePayBrand.colors.primary} />
          </View>
          <StewieText variant="bodyLarge" color="primary" weight="medium">
            {label}
          </StewieText>
        </View>
        <View style={styles.menuItemRight}>
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <StewieText variant="labelSmall" color="primary" style={{ color: '#FFFFFF' }}>
                {badge}
              </StewieText>
            </View>
          )}
          <Ionicons name="chevron-forward-outline" size={20} color={StewiePayBrand.colors.textMuted} />
        </View>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with greeting */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <StewieText variant="headlineLarge" color="primary" weight="black">
            {user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome'}
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
            Manage your account and preferences
          </StewieText>
        </Animated.View>

        {/* Insights Section */}
        <Animatable.View animation="fadeInUp" delay={50} duration={600}>
          <MenuSection title="Insights">
            <MenuItem
              icon="stats-chart-outline"
              label="Analytics"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Analytics');
              }}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="wallet-outline"
              label="Budgets"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Budgets');
              }}
            />
          </MenuSection>
        </Animatable.View>

        {/* More Section */}
        <Animatable.View animation="fadeInUp" delay={150} duration={600}>
          <MenuSection title="More">
            <MenuItem
              icon="repeat-outline"
              label="Subscriptions"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Subscriptions');
              }}
            />
          </MenuSection>
        </Animatable.View>

        {/* Account Section */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600}>
          <MenuSection title="Account">
            <MenuItem
              icon="person-outline"
              label="Account Settings"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Account');
              }}
            />
          </MenuSection>
        </Animatable.View>

        <View style={{ height: StewiePayBrand.spacing['2xl'] }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show FintechBackground
  },
  scrollContent: {
    paddingTop: StewiePayBrand.spacing['2xl'] + StewiePayBrand.spacing.xl + StewiePayBrand.spacing.md, // Even more padding to bring content down
    paddingBottom: StewiePayBrand.spacing.xl,
  },
  header: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    paddingBottom: StewiePayBrand.spacing.lg,
    marginBottom: StewiePayBrand.spacing.sm,
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
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.sm,
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
  divider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginLeft: StewiePayBrand.spacing.md + 40 + StewiePayBrand.spacing.md,
  },
  badge: {
    backgroundColor: StewiePayBrand.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

