import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

/**
 * The 108 Vision "108" brand mark — dark rounded square, white "108" and the
 * violet underline. Faithful to tracks/brand/logo/108-mark.svg, rebuilt with
 * native views so it renders identically on iOS, Android and web without a
 * bundled SVG/text glyph dependency.
 *
 * `ring` adds a hairline white border so the mark stays legible on dark
 * surfaces (e.g. the home hero gradient).
 */
export function BrandMark({
  height = 26,
  ring = false,
}: {
  height?: number;
  ring?: boolean;
}) {
  const width = height * (110 / 70);
  const fontSize = height * 0.6;
  const underlineHeight = Math.max(2, Math.round(height * 0.05));
  const underlineWidth = height * 0.46;

  return (
    <View
      style={{
        width,
        height,
        borderRadius: height * 0.17,
        backgroundColor: colors.ink950,
        borderWidth: ring ? 1 : 0,
        borderColor: ring ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.white,
          fontFamily: fonts.extrabold,
          fontSize,
          lineHeight: Math.round(fontSize * 1.05),
          letterSpacing: -0.5,
        }}
      >
        108
      </Text>
      <View
        style={{
          width: underlineWidth,
          height: underlineHeight,
          borderRadius: underlineHeight,
          backgroundColor: colors.primary400,
        }}
      />
    </View>
  );
}

/**
 * Full wordmark lock-up: the "108" mark beside the VISION wordmark.
 * `wordmark` defaults to "VISION"; pass "108Vision" for the app-name variant.
 * `light` switches the wordmark to white (and rings the mark) for dark surfaces.
 */
export function BrandLogo({
  wordmark = 'VISION',
  height = 26,
  light = false,
}: {
  wordmark?: string;
  height?: number;
  light?: boolean;
}) {
  return (
    <View style={styles.logo}>
      <BrandMark height={height} ring={light} />
      <Text
        style={[
          styles.wordmark,
          {
            fontSize: Math.round(height * 0.62),
            color: light ? colors.white : colors.ink950,
          },
        ]}
      >
        {wordmark}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: fonts.bold,
    letterSpacing: 1.5,
  },
});
