import { normalizeCategory, normalizeStyle } from './fashion-analysis'

export type FashionOccasion = 'casual' | 'office' | 'college' | 'party' | 'wedding' | 'date' | 'travel' | 'gym' | 'festival'

export type FashionKnowledgeItem = {
  key: string
  label: string
  categories: string[]
  styles: string[]
  seasons: string[]
  occasions: FashionOccasion[]
  related: string[]
  conflicts: string[]
  formality: number
  warmth: number
}

export const occasionAliases: Record<string, FashionOccasion> = {
  casual: 'casual',
  everyday: 'casual',
  office: 'office',
  work: 'office',
  business: 'office',
  'business-casual': 'office',
  college: 'college',
  campus: 'college',
  class: 'college',
  party: 'party',
  club: 'party',
  wedding: 'wedding',
  ceremony: 'wedding',
  date: 'date',
  dinner: 'date',
  travel: 'travel',
  airport: 'travel',
  gym: 'gym',
  workout: 'gym',
  festival: 'festival',
  concert: 'festival'
}

export const categoryRelationships: Record<string, string[]> = {
  tshirt: ['jeans', 'cargo', 'shorts', 'sneakers', 'jacket', 'accessories'],
  shirt: ['jeans', 'chinos', 'trousers', 'blazer', 'loafers', 'boots', 'sneakers'],
  polo: ['chinos', 'jeans', 'loafers', 'sneakers'],
  hoodie: ['cargo', 'jeans', 'sneakers', 'jacket'],
  jacket: ['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'boots', 'sneakers'],
  blazer: ['dress-shirt', 'shirt', 'trousers', 'chinos', 'loafers', 'oxford-shoes'],
  jeans: ['tshirt', 'shirt', 'hoodie', 'jacket', 'sneakers', 'boots'],
  cargo: ['oversized-tshirt', 'hoodie', 'jacket', 'sneakers'],
  chinos: ['polo', 'shirt', 'blazer', 'loafers', 'sneakers'],
  trousers: ['dress-shirt', 'shirt', 'blazer', 'loafers', 'oxford-shoes'],
  shorts: ['tshirt', 'linen-shirt', 'sneakers', 'sandals'],
  sneakers: ['tshirt', 'hoodie', 'jeans', 'cargo', 'shorts'],
  loafers: ['polo', 'shirt', 'chinos', 'trousers', 'blazer'],
  'oxford-shoes': ['dress-shirt', 'blazer', 'trousers'],
  boots: ['jeans', 'jacket', 'shirt'],
  slides: ['shorts', 'tshirt'],
  sandals: ['shorts', 'linen-shirt', 'dress']
}

export const styleRelationships: Record<string, string[]> = {
  casual: ['minimal', 'streetwear', 'sporty'],
  streetwear: ['casual', 'y2k', 'techwear'],
  minimal: ['casual', 'formal', 'old-money'],
  formal: ['minimal', 'old-money'],
  sporty: ['casual', 'streetwear'],
  festival: ['streetwear', 'y2k', 'vintage'],
  'old-money': ['minimal', 'formal']
}

export const seasonRelationships: Record<string, string[]> = {
  summer: ['linen-shirt', 'tshirt', 'polo', 'shorts', 'sandals', 'sneakers'],
  winter: ['hoodie', 'jacket', 'coat', 'boots', 'sweater'],
  spring: ['shirt', 'polo', 'jeans', 'chinos', 'sneakers', 'jacket'],
  autumn: ['shirt', 'jacket', 'jeans', 'boots', 'hoodie'],
  'all-season': ['tshirt', 'shirt', 'jeans', 'sneakers']
}

export const occasionRelationships: Record<FashionOccasion, {
  label: string
  core: string[]
  boost: string[]
  reduce: string[]
  preferredStyles: string[]
  minFormality: number
  maxFormality: number
  reasoning: string
}> = {
  casual: {
    label: 'Casual',
    core: ['tshirt', 'shirt', 'jeans', 'cargo', 'shorts', 'sneakers'],
    boost: ['tshirt', 'jeans', 'sneakers', 'shirt', 'jacket'],
    reduce: ['oxford-shoes', 'blazer', 'slides'],
    preferredStyles: ['casual', 'minimal', 'streetwear'],
    minFormality: 10,
    maxFormality: 72,
    reasoning: 'Casual outfits should feel relaxed, useful, and easy to repeat.'
  },
  office: {
    label: 'Office',
    core: ['polo', 'shirt', 'dress-shirt', 'chinos', 'trousers', 'loafers', 'blazer'],
    boost: ['polo', 'shirt', 'dress-shirt', 'chinos', 'trousers', 'loafers', 'blazer'],
    reduce: ['hoodie', 'gym-shorts', 'slides', 'sandals', 'cargo'],
    preferredStyles: ['minimal', 'formal', 'old-money'],
    minFormality: 52,
    maxFormality: 88,
    reasoning: 'Office styling needs polish without becoming ceremonial.'
  },
  college: {
    label: 'College',
    core: ['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'sneakers'],
    boost: ['tshirt', 'hoodie', 'jeans', 'cargo', 'sneakers'],
    reduce: ['oxford-shoes', 'blazer', 'heels'],
    preferredStyles: ['casual', 'streetwear', 'minimal', 'sporty'],
    minFormality: 5,
    maxFormality: 65,
    reasoning: 'College outfits should prioritize comfort, movement, and a clear personal style cue.'
  },
  party: {
    label: 'Party',
    core: ['shirt', 'jacket', 'jeans', 'dress', 'skirt', 'boots', 'sneakers', 'heels'],
    boost: ['shirt', 'jacket', 'boots', 'heels', 'accessories', 'dress'],
    reduce: ['gym-shorts', 'slides', 'thermal'],
    preferredStyles: ['streetwear', 'formal', 'y2k', 'minimal'],
    minFormality: 35,
    maxFormality: 90,
    reasoning: 'Party looks can carry stronger contrast, sharper shoes, and more expressive styling.'
  },
  wedding: {
    label: 'Wedding',
    core: ['dress-shirt', 'shirt', 'blazer', 'trousers', 'loafers', 'oxford-shoes', 'dress', 'heels'],
    boost: ['blazer', 'dress-shirt', 'trousers', 'loafers', 'oxford-shoes', 'dress', 'heels'],
    reduce: ['hoodie', 'gym-shorts', 'slides', 'cargo', 'sneakers'],
    preferredStyles: ['formal', 'minimal', 'old-money'],
    minFormality: 72,
    maxFormality: 100,
    reasoning: 'Wedding outfits should read intentional, polished, and respectful of the setting.'
  },
  date: {
    label: 'Date',
    core: ['shirt', 'polo', 'jacket', 'jeans', 'chinos', 'dress', 'skirt', 'boots', 'loafers', 'heels'],
    boost: ['shirt', 'polo', 'jacket', 'chinos', 'boots', 'loafers', 'dress'],
    reduce: ['gym-shorts', 'slides', 'thermal'],
    preferredStyles: ['minimal', 'casual', 'formal', 'old-money'],
    minFormality: 38,
    maxFormality: 84,
    reasoning: 'Date outfits work best when they look considered but still comfortable.'
  },
  travel: {
    label: 'Travel',
    core: ['tshirt', 'hoodie', 'jacket', 'jeans', 'cargo', 'sneakers'],
    boost: ['tshirt', 'hoodie', 'jacket', 'cargo', 'sneakers'],
    reduce: ['heels', 'oxford-shoes', 'blazer'],
    preferredStyles: ['casual', 'streetwear', 'techwear', 'minimal'],
    minFormality: 5,
    maxFormality: 68,
    reasoning: 'Travel outfits need comfort, pockets, flexible layers, and dependable footwear.'
  },
  gym: {
    label: 'Gym',
    core: ['tshirt', 'shorts', 'sneakers', 'hoodie'],
    boost: ['tshirt', 'shorts', 'sneakers', 'hoodie'],
    reduce: ['blazer', 'dress-shirt', 'loafers', 'oxford-shoes', 'boots'],
    preferredStyles: ['sporty', 'casual'],
    minFormality: 0,
    maxFormality: 42,
    reasoning: 'Gym outfits should favor movement, breathability, and athletic footwear.'
  },
  festival: {
    label: 'Festival',
    core: ['oversized-tshirt', 'tshirt', 'cargo', 'shorts', 'sneakers', 'boots', 'accessories'],
    boost: ['cargo', 'oversized-tshirt', 'sneakers', 'boots', 'accessories'],
    reduce: ['dress-shirt', 'oxford-shoes', 'blazer'],
    preferredStyles: ['streetwear', 'y2k', 'vintage', 'techwear'],
    minFormality: 5,
    maxFormality: 70,
    reasoning: 'Festival styling rewards personality, practical footwear, and utility details.'
  }
}

export function normalizeOccasion(value?: string): FashionOccasion {
  const key = String(value || 'casual').trim().toLowerCase().replace(/\s+/g, '-')
  return occasionAliases[key] || (key === 'formal' ? 'wedding' : 'casual')
}

export function itemKnowledgeKey(item: {
  category?: string
  style?: string
  fit?: string
  fitType?: string
  material?: string
  tags?: string[]
}) {
  const text = [
    item.category,
    item.style,
    item.fit,
    item.fitType,
    item.material,
    ...(item.tags || [])
  ].filter(Boolean).join(' ').toLowerCase()
  const category = normalizeCategory(item.category)

  if (text.includes('dress shirt') || text.includes('oxford shirt') || text.includes('button down')) return 'dress-shirt'
  if (text.includes('oversized') && (category === 'tshirt' || text.includes('tee'))) return 'oversized-tshirt'
  if (text.includes('linen') && (category === 'shirt' || category === 'tshirt')) return 'linen-shirt'
  if (text.includes('blazer')) return 'blazer'
  if (text.includes('chino')) return 'chinos'
  if (text.includes('trouser') || text.includes('formal pant')) return 'trousers'
  if (text.includes('loafer')) return 'loafers'
  if (text.includes('oxford') && (text.includes('shoe') || text.includes('footwear'))) return 'oxford-shoes'
  if (text.includes('slide')) return 'slides'
  if (text.includes('sandal')) return 'sandals'
  if (text.includes('gym short') || text.includes('training short')) return 'gym-shorts'
  return category
}

export function itemKnowledge(item: Parameters<typeof itemKnowledgeKey>[0]): FashionKnowledgeItem {
  const key = itemKnowledgeKey(item)
  const style = normalizeStyle(item.style)
  const related = categoryRelationships[key] || categoryRelationships[normalizeCategory(item.category)] || []
  const styleRelated = styleRelationships[style] || []
  return {
    key,
    label: key.replace(/-/g, ' '),
    categories: [key, normalizeCategory(item.category)].filter(Boolean),
    styles: [style, ...styleRelated],
    seasons: Object.entries(seasonRelationships).filter(([, values]) => values.includes(key)).map(([season]) => season),
    occasions: Object.entries(occasionRelationships)
      .filter(([, rule]) => rule.core.includes(key) || rule.boost.includes(key))
      .map(([occasion]) => occasion as FashionOccasion),
    related,
    conflicts: Object.entries(occasionRelationships)
      .filter(([, rule]) => rule.reduce.includes(key))
      .map(([occasion]) => occasion),
    formality: Number(itemKnowledgeFormality[key] ?? 45),
    warmth: Number(itemKnowledgeWarmth[key] ?? 40)
  }
}

const itemKnowledgeFormality: Record<string, number> = {
  tshirt: 22,
  'oversized-tshirt': 18,
  hoodie: 20,
  sneakers: 30,
  cargo: 28,
  shorts: 18,
  shirt: 52,
  polo: 56,
  chinos: 62,
  trousers: 72,
  'dress-shirt': 76,
  blazer: 84,
  loafers: 72,
  'oxford-shoes': 88,
  dress: 74,
  heels: 82,
  slides: 8,
  sandals: 18,
  boots: 58
}

const itemKnowledgeWarmth: Record<string, number> = {
  tshirt: 20,
  'oversized-tshirt': 22,
  'linen-shirt': 18,
  polo: 22,
  shorts: 16,
  sandals: 12,
  slides: 10,
  shirt: 30,
  dress: 32,
  jeans: 42,
  chinos: 38,
  trousers: 40,
  cargo: 42,
  sneakers: 28,
  loafers: 28,
  'oxford-shoes': 30,
  boots: 48,
  hoodie: 68,
  blazer: 58,
  jacket: 72
}
