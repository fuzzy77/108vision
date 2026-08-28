import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Pattern, Rect } from 'react-native-svg';


import {
  cardShadow,
  colors,
  fonts,
  gradients,
  radius,
  spacing,
} from '@/lib/theme';

export function Screen({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

/**
 * Subtle dot-grid overlay — the website hero's signature texture, reproduced
 * with react-native-svg so the app reads as the same brand on every platform.
 */
export function DotGrid({ opacity = 0.14 }: { opacity?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Pattern id="brand-dots" width={40} height={40} patternUnits="userSpaceOnUse">
        <Circle cx={1} cy={1} r={1} fill="#FFFFFF" />
      </Pattern>
      <Rect width="100%" height="100%" fill="url(#brand-dots)" opacity={opacity} />
    </Svg>
  );
}

export function SectionTitle({
  heading,
  subtitle,
}: {
  heading: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.heading}>{heading}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  featured = false,
  dark = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  featured?: boolean;
  dark?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        featured && styles.cardFeatured,
        dark && styles.cardDark,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>{children}</Text>;
}

export function Badge({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return <Text style={[styles.badge, light && styles.badgeLight]}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  if (disabled) {
    return (
      <View style={[styles.button, styles.buttonDisabled]}>
        <Text style={styles.buttonLabelDisabled}>{loading ? '…' : label}</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.9}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradients.cta}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>{loading ? '…' : label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.ink50,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 84,
    gap: spacing.lg,
  },
  sectionTitle: {
    gap: spacing.xs,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.ink950,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.ink700,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  cardFeatured: {
    borderColor: colors.primary200,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary700,
  },
  cardDark: {
    backgroundColor: colors.ink950,
    borderColor: colors.ink900,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.primary700,
  },
  eyebrowLight: {
    color: colors.primary400,
  },
  badge: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    color: colors.primary700,
    backgroundColor: colors.primary100,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  badgeLight: {
    color: colors.primary200,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.ink200,
  },
  buttonLabel: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  buttonLabelDisabled: {
    color: colors.ink400,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
