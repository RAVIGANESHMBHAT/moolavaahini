export const COMMUNITIES = [
  { slug: 'havyaka',         nameKey: 'havyaka' },
  { slug: 'samagra-kannada', nameKey: 'samagraKannada' },
] as const

export type CommunitySlug = (typeof COMMUNITIES)[number]['slug']
