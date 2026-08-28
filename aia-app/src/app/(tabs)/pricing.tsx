import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, Screen } from '@/components/ui';
import { AppIcon } from '@/lib/icons';
import { pricing } from '@/lib/content';
import { colors, fonts, spacing } from '@/lib/theme';

export default function PricingScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{pricing.heading}</Text>
        <Text style={styles.subtitle}>{pricing.intro}</Text>
      </View>

      {pricing.channels.map((channel) => (
        <View key={channel.title} style={styles.channel}>
          <Text style={styles.channelTitle}>{channel.title}</Text>
          {channel.plans.map((plan) => (
            <Card key={plan.name} featured={plan.highlighted}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
              {plan.highlighted ? <Badge>Consigliato</Badge> : null}
              <Text style={styles.planDescription}>{plan.description}</Text>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <AppIcon name="check" size={16} color={colors.primary700} />
                  <Text style={styles.feature}>{feature}</Text>
                </View>
              ))}
            </Card>
          ))}
        </View>
      ))}

      <Text style={styles.footnote}>{pricing.footnote}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.extrabold,
    color: colors.ink950,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.ink700,
  },
  channel: {
    gap: spacing.sm,
  },
  channelTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.ink950,
    marginTop: spacing.sm,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  planName: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.ink950,
    flexShrink: 1,
  },
  planPrice: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary700,
    backgroundColor: colors.primary50,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.ink700,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  feature: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.ink800,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.ink400,
  },
});
