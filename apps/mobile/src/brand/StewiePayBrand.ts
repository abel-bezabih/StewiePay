/**
 * StewiePay Brand Identity System
 * 
 * StewiePay is a premium fintech platform that empowers users with complete
 * control over their spending. Our brand reflects innovation, trust, and elegance.
 * 
 * Brand Values:
 * - Control & Empowerment
 * - Innovation & Cutting-Edge
 * - Trust & Security
 * - Premium Experience
 * - Clarity & Transparency
 */

export const StewiePayBrand = {
  // ============================================
  // BRAND COLORS
  // ============================================
  colors: {
    // Primary Brand Color - Deep Purple (Trust, Premium, Calm)
    primary: '#7C3AED', // Lighter purple
    primaryDark: '#6D28D9', // Darker purple
    primaryLight: '#8B5CF6', // Light purple
    
    // Secondary - Muted Cyan (Clarity, Technology)
    secondary: '#00A8CC',
    secondaryDark: '#0088AA',
    secondaryLight: '#00C8EE',
    
    // Accent - Reserved (Used sparingly for focus)
    accent: '#7C3AED', // Lighter purple
    accentDark: '#6D28D9', // Darker purple
    accentLight: '#8B5CF6', // Light purple
    
    // Success - Emerald Green (Growth, Positive, Trust)
    success: '#10B981',
    successDark: '#059669',
    successLight: '#34D399',
    
    // Warning - Amber (Caution, Attention)
    warning: '#F59E0B',
    warningDark: '#D97706',
    warningLight: '#FBBF24',
    
    // Error - Coral Red (Urgent, Action Required)
    error: '#EF4444',
    errorDark: '#DC2626',
    errorLight: '#F87171',
    
    // Backgrounds - Dark Gray (Premium, Modern, Clean)
    background: '#4B5563',      // Lighter dark gray - main background
    backgroundSecondary: '#6B7280', // Lighter gray - secondary surfaces
    surface: '#F5F5F5',         // Light gray - cards, elevated surfaces
    surfaceElevated: '#F0F0F0', // Lighter gray - modals, sheets
    surfaceVariant: '#E5E5E5',   // Even lighter - borders, dividers
    
    // Text Colors - Light (High Contrast on Dark Background)
    textPrimary: '#111827',       // Dark gray/black - primary text (changed from white for light theme)
    textSecondary: '#374151',     // Medium gray - secondary text
    textMuted: '#111827',         // Black - for small descriptions and secondary text
    textDisabled: '#6B7280',      // Darker gray - disabled text
    textOnPrimary: '#FFFFFF',     // White text for primary/gradient surfaces
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)', // Dark overlay for modals
    overlayLight: 'rgba(0, 0, 0, 0.3)', // Light overlay
    
    // Gradients - Subtle, Purposeful
    gradients: {
      primary: ['#8B5CF6', '#6D28D9'], // Lighter purple gradient
      secondary: ['#00A8CC', '#0088AA'],
      accent: ['#8B5CF6', '#6D28D9'], // Lighter purple gradient
      success: ['#10B981', '#059669'],
      dark: ['#0A0A0A', '#1A1A1A'],
    },
  },
  
  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    // Font Families
    fontFamily: {
      display: 'System', // SF Pro on iOS, Roboto on Android
      body: 'System',
      mono: 'Courier New', // For card numbers, codes
    },
    
    // Font Sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    
    // Font Weights
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    // Text Styles (Predefined combinations)
    styles: {
      // Display Styles
      displayLarge: {
        fontSize: 60,
        fontWeight: '900',
        lineHeight: 72,
        letterSpacing: -1,
      },
      displayMedium: {
        fontSize: 48,
        fontWeight: '800',
        lineHeight: 56,
        letterSpacing: -0.5,
      },
      displaySmall: {
        fontSize: 36,
        fontWeight: '800',
        lineHeight: 44,
        letterSpacing: -0.5,
      },
      
      // Headline Styles
      headlineLarge: {
        fontSize: 32,
        fontWeight: '900',
        lineHeight: 40,
        letterSpacing: 0,
      },
      headlineMedium: {
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 36,
        letterSpacing: 0,
      },
      headlineSmall: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        letterSpacing: 0,
      },
      
      // Title Styles
      titleLarge: {
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 28,
        letterSpacing: 0,
      },
      titleMedium: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: 0.15,
      },
      titleSmall: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
        letterSpacing: 0.1,
      },
      
      // Body Styles
      bodyLarge: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        letterSpacing: 0.5,
      },
      bodyMedium: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        letterSpacing: 0.25,
      },
      bodySmall: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
        letterSpacing: 0.4,
      },
      
      // Label Styles
      labelLarge: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: 0.1,
      },
      labelMedium: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: 0.5,
      },
      labelSmall: {
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: 0.5,
      },
    },
  },
  
  // ============================================
  // SPACING SYSTEM
  // ============================================
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 80,
    '5xl': 96,
  },
  
  // ============================================
  // BORDER RADIUS
  // ============================================
  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  // ============================================
  // SHADOWS & ELEVATION
  // ============================================
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
    glow: {
      shadowColor: '#5B21B6', // Deep purple
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 0,
    },
    // Modern multi-layer shadows for depth
    depth: {
      layer1: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
      },
      layer2: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
      layer3: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
    },
    // Colored glows for primary elements
    primaryGlow: {
      shadowColor: '#5B21B6', // Deep purple
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 0,
    },
    secondaryGlow: {
      shadowColor: '#00A8CC',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 0,
    },
  },
  
  // ============================================
  // GLASSMORPHISM
  // ============================================
  glassmorphism: {
    // Blur intensities
    blur: {
      light: 10,
      medium: 20,
      heavy: 30,
    },
    // Background opacities
    background: {
      light: 'rgba(26, 26, 26, 0.4)',
      medium: 'rgba(26, 26, 26, 0.6)',
      heavy: 'rgba(26, 26, 26, 0.8)',
    },
    // Border colors
    border: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.1)',
      heavy: 'rgba(255, 255, 255, 0.15)',
    },
    // Overlay opacities
    overlay: {
      light: 'rgba(255, 255, 255, 0.01)',
      medium: 'rgba(255, 255, 255, 0.02)',
      heavy: 'rgba(255, 255, 255, 0.03)',
    },
  },
  
  // ============================================
  // ANIMATIONS
  // ============================================
  animation: {
    // Durations
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
    
    // Easing
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    // Spring Config
    spring: {
      damping: 15,
      stiffness: 100,
      mass: 1,
    },
  },
  
  // ============================================
  // BRAND VALUES & MESSAGING
  // ============================================
  brand: {
    name: 'StewiePay',
    tagline: '',
    mission: 'Financial control and precision',
    values: {
      control: 'Complete control over every transaction',
      innovation: 'Cutting-edge technology for modern finance',
      trust: 'Secure, transparent, and reliable',
      premium: 'Beautiful, intuitive, and delightful',
    },
  },
  
  // ============================================
  // COMPONENT STYLES
  // ============================================
  components: {
    // Card Styles
    card: {
      backgroundColor: '#1A1A1A',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    
    // Button Styles
    button: {
      primary: {
        backgroundColor: '#5B21B6', // Deep purple
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#5B21B6', // Deep purple
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
      },
    },
    
    // Input Styles
    input: {
      backgroundColor: '#1A1A1A',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#2A2A2A',
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: '#FFFFFF',
    },
  },
};

// Helper functions
export const getBrandGradient = (type: 'primary' | 'secondary' | 'accent' | 'success' | 'dark') => {
  return StewiePayBrand.colors.gradients[type];
};

export const getBrandColor = (path: string) => {
  const keys = path.split('.');
  let value: any = StewiePayBrand.colors;
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return '#5B21B6'; // Fallback to primary (deep purple)
  }
  return value;
};

// Default export for compatibility
export default StewiePayBrand;

