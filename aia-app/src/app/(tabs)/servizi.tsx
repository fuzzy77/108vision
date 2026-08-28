import { StyleSheet, Text, View } from 'react-native';

import { Card, Eyebrow, Screen, SectionTitle } from '@/components/ui';
import { AppIcon } from '@/lib/icons';
import { services } from '@/lib/content';
import { colors, fonts, spacing } from '@/lib/theme';

export default function ServiziScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{services.heading}</Text>
        <Text style={styles.subtitle}>{services.intro}</Text>
      </View>

      {services.channels.map((channel) => (
        <View key={channel.name} style={styles.channel}>
          <Card featured>
            <Eyebrow>{channel.name}</Eyebrow>
            <Text style={styles.heroTitle}>{channel.heroTitle}</Text>
            <Text style={styles.cardText}>{channel.heroSubtitle}</Text>
          </Card>

          <SectionTitle
            heading={channel.features.heading}
            subtitle={channel.features.intro}
          />
          {channel.features.items.map((item) => (
            <Card key={item.title}>
              <View style={styles.itemHeader}>
                <AppIcon name={item.icon} size={22} color={colors.primary700} />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.cardText}>{item.description}</Text>
            </Card>
          ))}
        </View>
      ))}
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
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.extrabold,
    color: colors.ink950,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.ink950,
    flexShrink: 1,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.ink700,
  },
});
