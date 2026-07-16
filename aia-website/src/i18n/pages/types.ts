import type { Locale } from '../config';

export interface ServiceFeature {
  title: string;
  description: string;
  icon: string;
}

export interface ServicePlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface TextCard {
  title: string;
  text: string;
}

export interface IconCard extends TextCard {
  icon: string;
}

export interface ComparisonRow {
  feature: string;
  ai108: string;
  chatgpt: string;
  cursor: string;
}

export interface HowItWorksStep {
  title: string;
  text: string;
}

export interface PrincipleCard {
  title: string;
  text: string;
}

export interface BulletCompare {
  without: { title: string; items: string[] };
  with: { title: string; items: string[] };
}

export interface ProcessStep {
  title: string;
  text: string;
}

export interface StatCard {
  value: string;
  text: string;
}

export interface IconProblemCard {
  icon: string;
  title: string;
  text: string;
}

export interface PainPointCard {
  quote: string;
  text: string;
}

export interface ModeCard {
  icon: string;
  title: string;
  text: string;
  idealFor: string;
  anchor: string;
}

export interface ModeSection {
  label: string;
  title: string;
  subtitle: string;
}

export interface PdfGuideBlock {
  title: string;
  description: string;
  path: string;
  cta: string;
}

export type LocaleContent<T> = Record<Locale, T>;
