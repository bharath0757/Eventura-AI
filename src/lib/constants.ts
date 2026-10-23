/**
 * Eventura AI — Design tokens and application constants
 */

export const BRAND = {
  name: 'Eventura AI',
  tagline: 'Your Vision. Your Budget. Your Perfect Event.',
  description:
    'Eventura AI is a GenAI-powered event-planning assistant that helps you plan weddings, birthdays, and community events with personalized plans, smart budgets, and adaptive recommendations.',
} as const;

/** Semantic colour palette — used as Tailwind classes */
export const COLORS = {
  /** Midnight blue — primary navigation */
  primary: {
    DEFAULT: '#1e2a4a',
    light: '#2d3f6b',
    dark: '#141d35',
  },
  /** Warm ivory — backgrounds */
  ivory: {
    DEFAULT: '#faf7f2',
    light: '#fdfcfa',
    dark: '#f0ebe3',
  },
  /** Coral — primary actions */
  coral: {
    DEFAULT: '#e8735a',
    light: '#f09983',
    dark: '#c95a42',
  },
  /** Emerald green — completed / positive */
  emerald: {
    DEFAULT: '#2d9f6f',
    light: '#4fbf8f',
    dark: '#1f7a52',
  },
  /** Soft lavender — AI insights */
  lavender: {
    DEFAULT: '#b8a9d4',
    light: '#d4c9e8',
    dark: '#8e7bb5',
  },
} as const;

/** Event category metadata */
export const EVENT_CATEGORIES = [
  {
    key: 'wedding' as const,
    label: 'Wedding',
    description: 'Plan your dream wedding from ceremony to reception',
    icon: 'Heart',
  },
  {
    key: 'birthday' as const,
    label: 'Birthday',
    description: 'Create memorable birthday celebrations for any age',
    icon: 'Cake',
  },
  {
    key: 'community' as const,
    label: 'Community Event',
    description: 'Organise festivals, fundraisers, and local gatherings',
    icon: 'Users',
  },
] as const;
