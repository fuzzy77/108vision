import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, DotGrid, Eyebrow, Screen, SectionTitle } from '@/components/ui';
import { BrandLogo } from '@/components/brand';
import { AppIcon } from '@/lib/icons';
import { home } from '@/lib/content';
import { colors, fonts, gradients, radius, spacing } from '@/lib/theme';

export default function HomeScreen() {
  return (
    <Screen>
      <Head>
        <title>108Vision</title>
      </Head>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <DotGrid />
        <View style={styles.heroGlow} />
        <View style={styles.heroGlowSecondary} />
        <BrandLogo light height={30} />
        <Text style={styles.heroTitle}>{home.hero.title}</Text>
        <Text style={styles.heroSubtitle}>{home.hero.subtitle}</Text>
        <Link href="/contact" asChild>
          <Pressable style={styles.heroCta}>
            <Text style={styles.heroCtaText}>Parla con noi</Text>
          </Pressable>
        </Link>
      </LinearGradient>

      <SectionTitle heading={home.problem.heading} subtitle={home.problem.intro} />
      {home.problem.items.map((item) => (
        <Card key={item.title}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.text}</Text>
        </Card>
      ))}

      <Card featured>
        <Text style={styles.cardTitle}>{home.cost.heading}</Text>
        <Text style={styles.cardText}>{home.cost.text}</Text>
      </Card>

      <SectionTitle heading={home.channels.heading} subtitle={home.channels.subheading} />
      {home.channels.items.map((item) => (
        <Card key={item.title} featured>
          <AppIcon name={item.icon} size={24} color={colors.primary700} />
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.description}</Text>
        </Card>
      ))}

      <SectionTitle heading={home.fit.heading} />
      <Card>
        <Eyebrow>{home.fit.ideal.title}</Eyebrow>
        {home.fit.ideal.items.map((item) => (
          <View key={item} style={styles.checkRow}>
            <AppIcon name="check" size={16} color={colors.primary700} />
            <Text style={styles.listItem}>{item}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Eyebrow>{home.fit.notIdeal.title}</Eyebrow>
        {home.fit.notIdeal.items.map((item) => (
          <View key={item} style={styles.checkRow}>
            <AppIcon name="minus" size={16} color={colors.ink400} />
            <Text style={styles.listItemMuted}>{item}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle heading={home.entry.heading} />
      {home.entry.steps.map((step) => (
        <Card key={step.title}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.cardText}>{step.text}</Text>
        </Card>
      ))}

      <Card dark>
        <Eyebrow light>{home.assistant.eyebrow}</Eyebrow>
        <Text style={styles.darkTitle}>{home.assistant.title}</Text>
        <Text style={styles.darkText}>{home.assistant.description}</Text>
        <Link href="/prompt" style={styles.link}>
          Prova l’Assistente
        </Link>
      </Card>

      <Card>
        <Text style={styles.ctaTitle}>{home.cta.title}</Text>
        <Text style={styles.cardText}>{home.cta.description}</Text>
        <Link href="/contact" style={styles.link}>
          Contattaci
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -70,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(30, 27, 75, 0.55)',
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: fonts.extrabold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  heroCtaText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary700,
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  listItem: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.ink800,
  },
  listItemMuted: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.ink400,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primary700,
  },
  darkTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.extrabold,
    color: colors.white,
  },
  darkText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  ctaTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.ink950,
  },
  link: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary700,
    marginTop: spacing.xs,
  },
});
