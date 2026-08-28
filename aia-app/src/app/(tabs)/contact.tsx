import { Link } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { AppIcon } from '@/lib/icons';
import { contact } from '@/lib/content';
import { colors, fonts, spacing } from '@/lib/theme';

const LINKEDIN_URL = 'https://linkedin.com/in/eliosscoglio';
const BOOKING_URL = 'https://www.108vision.it/contatti';

export default function ContactScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{contact.heading}</Text>
        <Text style={styles.subtitle}>{contact.intro}</Text>
      </View>

      <SectionTitle heading={contact.pathsHeading} />
      {contact.paths.map((path) => (
        <Card key={path.title} featured>
          <Text style={styles.cardTitle}>{path.title}</Text>
          <Text style={styles.cardText}>{path.description}</Text>
          <Text style={styles.nextStep}>{path.nextStep}</Text>
        </Card>
      ))}

      <Card>
        <Text style={styles.cardTitle}>{contact.partnershipTitle}</Text>
        <Text style={styles.cardText}>{contact.partnershipDescription}</Text>
      </Card>

      <Card>
        <Text style={styles.cardText}>{contact.appDescription}</Text>
        <Link href="/prompt" style={styles.link}>
          {contact.appLink}
        </Link>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Contatti</Text>
        <Pressable onPress={() => Linking.openURL(`mailto:${contact.email}`)}>
          <View style={styles.contactRow}>
            <AppIcon name="mail" size={18} color={colors.primary700} />
            <Text style={styles.contactText}>{contact.email}</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(LINKEDIN_URL)}>
          <View style={styles.contactRow}>
            <AppIcon name="external-link" size={18} color={colors.primary700} />
            <Text style={styles.contactText}>{contact.linkedin}</Text>
          </View>
        </Pressable>
      </Card>

      <PrimaryButton
        label={contact.bookDirect}
        onPress={() => Linking.openURL(BOOKING_URL)}
      />
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
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.ink950,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.ink700,
  },
  nextStep: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary700,
  },
  link: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary700,
    marginTop: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  contactText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.ink900,
  },
});
