import { Ionicons } from '@expo/vector-icons';

export const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Food & Drink': 'restaurant-outline',
    'Shopping': 'bag-outline',
    'Travel': 'airplane-outline',
    'Entertainment': 'film-outline',
    'Bills & Utilities': 'flash-outline',
    'Transportation': 'car-outline',
    'Healthcare': 'medical-outline',
    'Education': 'school-outline',
    'Gambling': 'dice-outline',
    'Other': 'grid-outline',
  };
  return icons[category || 'Other'] || 'grid-outline';
};

export const getCategoryColor = (category?: string, index?: number): string => {
  const colors: Record<string, string> = {
    'Food & Drink': '#F59E0B',
    'Shopping': '#8B5CF6',
    'Travel': '#3B82F6',
    'Entertainment': '#EC4899',
    'Bills & Utilities': '#10B981',
    'Transportation': '#6366F1',
    'Healthcare': '#EF4444',
    'Education': '#14B8A6',
    'Gambling': '#F97316',
    'Other': '#6B7280',
  };

  if (category && colors[category]) {
    return colors[category];
  }

  // Fallback to index-based colors if category not found
  const fallbackColors = [
    '#6B7280', // Neutral gray for unknown categories
    '#6B7280',
    '#6B7280',
    '#6B7280',
    '#6B7280',
    '#6B7280',
    '#6B7280',
    '#6B7280',
    '#6B7280',
    '#6B7280',
  ];
  return fallbackColors[index || 0 % fallbackColors.length];
};
