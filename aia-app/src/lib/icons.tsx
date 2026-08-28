import {
  Briefcase,
  Check,
  CodeXml,
  Compass,
  Euro,
  ExternalLink,
  Handshake,
  House,
  Mail,
  Map,
  Minus,
  Search,
  Settings,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';

import { colors } from '@/lib/theme';

/**
 * Single icon vocabulary for the app, mapped from the 108 Vision design system
 * (Lucide, stroke 1.5). Screens reference semantic keys — never raw emoji or
 * ad-hoc glyphs — so the whole app shares one visual language with the website.
 */
export const ICONS = {
  compass: Compass,
  wrench: Wrench,
  map: Map,
  settings: Settings,
  users: Users,
  search: Search,
  'code-xml': CodeXml,
  handshake: Handshake,
  house: House,
  briefcase: Briefcase,
  euro: Euro,
  mail: Mail,
  sparkles: Sparkles,
  check: Check,
  minus: Minus,
  'external-link': ExternalLink,
} as const;

export type IconName = keyof typeof ICONS;

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function AppIcon({
  name,
  size = 24,
  color = colors.ink950,
  strokeWidth = 1.5,
}: AppIconProps) {
  const Icon: LucideIcon = ICONS[name];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
