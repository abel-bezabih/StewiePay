import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator } from 'react-native';
import { CardsAPI } from '../api/client';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from './stewiepay/StewieCard';
import { StewieText } from './stewiepay/StewieText';
import { StewieButton } from './stewiepay/StewieButton';
import { Ionicons } from '@expo/vector-icons';

const DAYS = [
  { label: 'Sun', value: 0, full: 'Sunday' },
  { label: 'Mon', value: 1, full: 'Monday' },
  { label: 'Tue', value: 2, full: 'Tuesday' },
  { label: 'Wed', value: 3, full: 'Wednesday' },
  { label: 'Thu', value: 4, full: 'Thursday' },
  { label: 'Fri', value: 5, full: 'Friday' },
  { label: 'Sat', value: 6, full: 'Saturday' },
];

interface TimeWindowManagerProps {
  cardId: string;
  initialEnabled: boolean;
  initialDaysOfWeek?: number[];
  initialStartTime?: string;
  initialEndTime?: string;
  initialTimezone?: string;
  onSave: () => void;
}

export const TimeWindowManager: React.FC<TimeWindowManagerProps> = ({
  cardId,
  initialEnabled,
  initialDaysOfWeek = [],
  initialStartTime = '09:00',
  initialEndTime = '17:00',
  initialTimezone = 'Africa/Addis_Ababa',
  onSave,
}) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialDaysOfWeek);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (dayValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (daysOfWeek.includes(dayValue)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayValue));
    } else {
      setDaysOfWeek([...daysOfWeek, dayValue].sort());
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const payload: any = {
        enabled,
      };

      if (enabled) {
        if (daysOfWeek.length === 0) {
          setError('Please select at least one day of the week');
          setLoading(false);
          return;
        }
        payload.daysOfWeek = daysOfWeek;
        payload.startTime = startTime;
        payload.endTime = endTime;
        payload.timezone = initialTimezone;
      }

      await CardsAPI.updateTimeWindow(cardId, payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update time window');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const selectWeekdays = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDaysOfWeek([1, 2, 3, 4, 5]); // Monday to Friday
  };

  const selectWeekend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDaysOfWeek([0, 6]); // Sunday and Saturday
  };

  const selectAllDays = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
  };

  return (
    <Animatable.View animation="fadeInUp" duration={600}>
      <StewieCard elevated style={styles.container}>
        <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.sectionTitle}>
          Time Window Controls
        </StewieText>
        <StewieText variant="bodyMedium" color="muted" style={styles.description}>
          Restrict when this card can be used
        </StewieText>

        {/* Enable/Disable Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <StewieText variant="titleMedium" color="primary" weight="semibold">
              Enable Time Restrictions
            </StewieText>
            <StewieText variant="bodySmall" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
              {enabled ? 'Card usage restricted to selected times' : 'No time restrictions'}
            </StewieText>
          </View>
          <Switch
            value={enabled}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEnabled(value);
            }}
            trackColor={{ false: StewiePayBrand.colors.surfaceVariant, true: StewiePayBrand.colors.primary }}
            thumbColor={enabled ? StewiePayBrand.colors.textPrimary : StewiePayBrand.colors.textMuted}
          />
        </View>

        {enabled && (
          <Animatable.View animation="fadeIn" duration={300} style={styles.controlsContainer}>
            {/* Days of Week */}
            <StewieText variant="titleMedium" color="primary" weight="semibold" style={styles.subsectionTitle}>
              Allowed Days
            </StewieText>
            <View style={styles.quickSelectRow}>
              <StewieButton
                label="Weekdays"
                onPress={selectWeekdays}
                variant="outline"
                size="sm"
                style={styles.quickButton}
              />
              <StewieButton
                label="Weekend"
                onPress={selectWeekend}
                variant="outline"
                size="sm"
                style={styles.quickButton}
              />
              <StewieButton
                label="All Days"
                onPress={selectAllDays}
                variant="outline"
                size="sm"
                style={styles.quickButton}
              />
            </View>
            <View style={styles.daysContainer}>
              {DAYS.map((day) => {
                const isSelected = daysOfWeek.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: isSelected
                          ? StewiePayBrand.colors.primary
                          : StewiePayBrand.colors.surfaceVariant,
                      },
                    ]}
                  >
                    <StewieText
                      variant="labelMedium"
                      weight={isSelected ? 'bold' : 'regular'}
                      style={{
                        color: isSelected
                          ? StewiePayBrand.colors.textPrimary
                          : StewiePayBrand.colors.textMuted,
                      }}
                    >
                      {day.label}
                    </StewieText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Range */}
            <StewieText variant="titleMedium" color="primary" weight="semibold" style={styles.subsectionTitle}>
              Allowed Hours
            </StewieText>
            <View style={styles.timeRow}>
              <View style={styles.timeInputContainer}>
                <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                  Start Time
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="time-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    keyboardType="default"
                    style={styles.timeInput}
                  />
                </View>
              </View>
              <View style={styles.timeInputContainer}>
                <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                  End Time
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="time-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="17:00"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    keyboardType="default"
                    style={styles.timeInput}
                  />
                </View>
              </View>
            </View>
            <StewieText variant="bodySmall" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
              Format: HH:mm (24-hour format, e.g., 09:00, 17:00)
            </StewieText>
          </Animatable.View>
        )}

        {error && (
          <Animatable.View animation="shake" duration={500}>
            <StewieText variant="bodyMedium" color="error" style={styles.errorText}>
              {error}
            </StewieText>
          </Animatable.View>
        )}

        <StewieButton
          label={loading ? 'Saving...' : 'Save Time Controls'}
          onPress={handleSave}
          variant="primary"
          size="md"
          fullWidth
          disabled={loading || (enabled && daysOfWeek.length === 0)}
          style={styles.saveButton}
          icon={loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
        />
      </StewieCard>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.lg,
  },
  sectionTitle: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  description: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.lg,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  toggleLabel: {
    flex: 1,
    marginRight: StewiePayBrand.spacing.md,
  },
  controlsContainer: {
    marginTop: StewiePayBrand.spacing.md,
  },
  subsectionTitle: {
    marginTop: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.md,
  },
  quickButton: {
    flex: 1,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.lg,
  },
  dayChip: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.full,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.xs,
  },
  timeInputContainer: {
    flex: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  inputIcon: {
    marginRight: StewiePayBrand.spacing.sm,
  },
  timeInput: {
    flex: 1,
    ...StewiePayBrand.typography.styles.bodyMedium,
    color: StewiePayBrand.colors.textPrimary,
  },
  errorText: {
    textAlign: 'center',
    marginTop: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
  },
  saveButton: {
    marginTop: StewiePayBrand.spacing.lg,
  },
});
