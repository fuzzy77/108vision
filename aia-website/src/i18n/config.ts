/** Supported locales — always add content for BOTH when extending the site. */
export const locales = ['it', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'it';

export const localeLabels: Record<Locale, string> = {
  it: 'IT',
  en: 'EN',
};

export const localeNames: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
};

export const ogLocales: Record<Locale, string> = {
  it: 'it_IT',
  en: 'en_GB',
};

export const htmlLang: Record<Locale, string> = {
  it: 'it',
  en: 'en',
};

export const dateLocales: Record<Locale, string> = {
  it: 'it-IT',
  en: 'en-GB',
};
