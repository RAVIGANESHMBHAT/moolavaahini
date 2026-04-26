export const CATEGORIES = [
  { slug: 'ogatu',        icon: '📖', nameKey: 'ogatu' },
  { slug: 'gaade',        icon: '💬', nameKey: 'gaade' },
  { slug: 'naati-aushadha', icon: '🌿', nameKey: 'naatiAushadha' },
  { slug: 'recipe',       icon: '🍽️', nameKey: 'recipe' },
  { slug: 'ritual',       icon: '🪔', nameKey: 'ritual' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']
export type CategoryNameKey = (typeof CATEGORIES)[number]['nameKey']
