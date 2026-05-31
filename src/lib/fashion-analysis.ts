import { normalizeColor, normalizeColors } from './color-engine'

export const clothingCategories = ['unknown', 'tshirt', 'shirt', 'hoodie', 'jacket', 'jeans', 'cargo', 'shorts', 'sneakers', 'boots', 'accessories'] as const
export const fashionStyles = ['streetwear', 'minimal', 'formal', 'casual', 'techwear', 'old-money', 'vintage', 'sporty', 'y2k'] as const
export const seasons = ['summer', 'winter', 'spring', 'autumn', 'all-season'] as const
export const fits = ['oversized', 'slim', 'regular', 'baggy'] as const

export type ClothingCategory = typeof clothingCategories[number]
export type FashionStyle = typeof fashionStyles[number]
export type Season = typeof seasons[number]
export type FitType = typeof fits[number]

export type FashionAnalysis = {
  category: ClothingCategory
  primaryColor: string
  secondaryColors: string[]
  color: string
  colors: string[]
  style: FashionStyle
  season: Season
  fit: FitType
  fitType: FitType
  formalityScore: number
  warmthScore: number
  occasion: string[]
  tags: string[]
  material?: string
}

const categoryAliases: Array<[ClothingCategory, string[]]> = [
  ['hoodie', ['hoodie', 'sweatshirt', 'pullover', 'fleece']],
  ['jacket', ['jacket', 'coat', 'blazer', 'parka', 'overshirt', 'windbreaker']],
  ['sneakers', ['sneaker', 'trainer', 'shoe', 'running shoe', 'high top', 'high-top']],
  ['boots', ['boot', 'chelsea', 'combat boot']],
  ['cargo', ['cargo', 'cargos']],
  ['jeans', ['jean', 'denim']],
  ['shorts', ['short']],
  ['tshirt', ['tshirt', 't-shirt', 'tee', 't shirt']],
  ['shirt', ['shirt', 'button', 'oxford', 'polo']],
  ['accessories', ['watch', 'cap', 'belt', 'bag', 'scarf', 'chain', 'ring', 'accessory']]
]

const styleAliases: Record<FashionStyle, string[]> = {
  streetwear: ['street', 'streetwear', 'oversized', 'graphic', 'cargo', 'sneaker', 'drop shoulder'],
  minimal: ['minimal', 'plain', 'clean', 'essential', 'quiet', 'solid'],
  formal: ['formal', 'tailored', 'blazer', 'oxford', 'dress', 'suit', 'smart'],
  casual: ['casual', 'daily', 'everyday', 'relaxed'],
  techwear: ['techwear', 'nylon', 'utility', 'goretex', 'gorpcore', 'tactical'],
  'old-money': ['old money', 'old-money', 'polo', 'loafers', 'linen', 'cashmere', 'preppy'],
  vintage: ['vintage', 'retro', 'washed', 'distressed', 'varsity'],
  sporty: ['sport', 'sporty', 'gym', 'athletic', 'active', 'performance'],
  y2k: ['y2k', 'baggy', 'wide leg', 'baby tee', 'metallic']
}

const colorWords = ['black', 'white', 'gray', 'grey', 'charcoal', 'navy', 'blue', 'brown', 'beige', 'tan', 'cream', 'green', 'olive', 'red', 'burgundy', 'pink', 'yellow', 'orange', 'purple', 'silver', 'gold']
const materialWords = ['denim', 'cotton', 'wool', 'linen', 'leather', 'fleece', 'nylon', 'polyester', 'suede', 'canvas']

export function normalizeCategory(value?: string): ClothingCategory {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'auto' || text === 'unknown') return 'unknown'
  if (['tshirt', 't-shirt', 'tee', 't shirt', 't-shirts', 'tees'].includes(text)) return 'tshirt'
  if (text === 'pants' || text === 'trouser' || text === 'trousers') return 'jeans'
  if (text === 'cargos') return 'cargo'
  if (text === 'shoes') return 'sneakers'
  const hit = categoryAliases.find(([, aliases]) => aliases.some((alias) => text.includes(alias)))
  return hit?.[0] || 'unknown'
}

export function detectCategoryFromFilename(name?: string): ClothingCategory {
  const lower = String(name || '').toLowerCase()

  if (lower.includes('hoodie') || lower.includes('sweatshirt')) return 'hoodie'
  if (lower.includes('jacket') || lower.includes('coat') || lower.includes('blazer')) return 'jacket'
  if (lower.includes('jeans') || lower.includes('denim')) return 'jeans'
  if (lower.includes('cargo')) return 'cargo'
  if (lower.includes('tshirt') || lower.includes('t-shirt') || lower.includes('tee')) return 'tshirt'
  if (lower.includes('shirt') || lower.includes('polo') || lower.includes('oxford')) return 'shirt'
  if (lower.includes('short')) return 'shorts'
  if (lower.includes('sneaker') || lower.includes('shoe') || lower.includes('trainer')) return 'sneakers'
  if (lower.includes('boot')) return 'boots'
  if (lower.includes('watch') || lower.includes('belt') || lower.includes('cap') || lower.includes('bag')) return 'accessories'

  return 'unknown'
}

export function legacyCategory(category?: string) {
  const normalized = normalizeCategory(category)
  if (normalized === 'tshirt') return 't-shirt'
  if (normalized === 'cargo') return 'cargos'
  return normalized
}

export function normalizeStyle(value?: string): FashionStyle {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'auto' || text === 'unknown') return 'casual'
  const direct = fashionStyles.find((style) => style === text)
  if (direct) return direct
  const hit = Object.entries(styleAliases).find(([, aliases]) => aliases.some((alias) => text.includes(alias)))
  return (hit?.[0] as FashionStyle) || 'minimal'
}

export function normalizeSeason(value?: string): Season {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'auto' || text === 'unknown') return 'all-season'
  if (text === 'fall') return 'autumn'
  return seasons.find((season) => season === text) || 'all-season'
}

export function normalizeFit(value?: string): FitType {
  const text = String(value || '').trim().toLowerCase()
  if (text.includes('oversized')) return 'oversized'
  if (text.includes('slim') || text.includes('skinny')) return 'slim'
  if (text.includes('baggy') || text.includes('wide') || text.includes('relaxed')) return 'baggy'
  return 'regular'
}

function detectSeason(text: string, category: ClothingCategory): Season {
  if (text.includes('wool') || text.includes('fleece') || text.includes('parka') || ['hoodie', 'jacket', 'boots'].includes(category)) return 'winter'
  if (text.includes('linen') || text.includes('lightweight') || category === 'shorts' || text.includes('tee')) return 'summer'
  if (text.includes('suede') || text.includes('earth tone')) return 'autumn'
  return 'all-season'
}

function formalityFor(category: ClothingCategory, style: FashionStyle) {
  let score = 45
  if (category === 'unknown') return score
  if (['shirt', 'jacket', 'boots'].includes(category)) score += 15
  if (['hoodie', 'shorts', 'sneakers'].includes(category)) score -= 12
  if (style === 'formal' || style === 'old-money') score += 25
  if (style === 'streetwear' || style === 'sporty' || style === 'y2k') score -= 10
  return Math.max(0, Math.min(100, score))
}

function warmthFor(category: ClothingCategory, material?: string) {
  let score = 40
  if (category === 'unknown') return score
  if (category === 'jacket') score += 35
  if (category === 'hoodie') score += 25
  if (category === 'boots') score += 15
  if (category === 'shorts' || category === 'tshirt') score -= 18
  if (material && ['wool', 'fleece', 'leather', 'suede'].includes(material)) score += 16
  if (material && ['linen', 'cotton'].includes(material)) score -= 6
  return Math.max(0, Math.min(100, score))
}

function occasionsFor(category: ClothingCategory, style: FashionStyle, formalityScore: number) {
  const occasions = new Set<string>(['casual'])
  if (['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'sneakers'].includes(category)) occasions.add('college')
  if (['tshirt', 'shorts', 'sneakers'].includes(category) || style === 'sporty') occasions.add('gym')
  if (formalityScore >= 62) occasions.add('formal')
  if (['streetwear', 'y2k'].includes(style)) occasions.add('party')
  if (['hoodie', 'jacket', 'cargo', 'sneakers'].includes(category)) occasions.add('travel')
  if (style === 'old-money' || style === 'minimal') occasions.add('date')
  return [...occasions]
}

export function analyzeClothingText(input: string): FashionAnalysis {
  const text = input.toLowerCase()
  const category = normalizeCategory(text)
  const rawColors = colorWords.filter((color) => text.includes(color))
  const colors = rawColors.length ? normalizeColors(rawColors) : []
  const style = normalizeStyle(text)
  const fit = normalizeFit(text)
  const material = materialWords.find((word) => text.includes(word))
  const season = detectSeason(text, category)
  const formalityScore = formalityFor(category, style)
  const warmthScore = warmthFor(category, material)
  const tags = [...new Set([style, season, category, fit, material, ...colors].filter(Boolean) as string[])]

  return {
    category,
    primaryColor: colors[0] || normalizeColor(rawColors[0] || 'unknown'),
    secondaryColors: colors.slice(1),
    color: colors[0] || 'unknown',
    colors,
    style,
    season,
    fit,
    fitType: fit,
    formalityScore,
    warmthScore,
    occasion: occasionsFor(category, style, formalityScore),
    tags,
    material
  }
}

type RawFashionEnhancement = Partial<Omit<FashionAnalysis, 'category' | 'style' | 'season' | 'fit' | 'fitType'>> & {
  category?: string
  style?: string
  season?: string
  fit?: string
  fitType?: string
}

export function mergeFashionAnalysis(base: FashionAnalysis, enhancement: RawFashionEnhancement) {
  const enhancementColors = [
    enhancement.primaryColor,
    ...(enhancement.secondaryColors || []),
    ...(enhancement.colors || [])
  ].filter(Boolean)
  const colors = enhancementColors.length
    ? normalizeColors(enhancementColors)
    : [base.primaryColor, ...base.secondaryColors].filter((color) => color && color !== 'unknown')

  const category = enhancement.category && !['auto', 'unknown'].includes(enhancement.category.toLowerCase()) ? normalizeCategory(enhancement.category) : base.category
  const style = enhancement.style && !['auto', 'unknown'].includes(enhancement.style.toLowerCase()) ? normalizeStyle(enhancement.style) : base.style
  const season = enhancement.season && !['auto', 'unknown'].includes(enhancement.season.toLowerCase()) ? normalizeSeason(enhancement.season) : base.season
  const fit = enhancement.fit || enhancement.fitType ? normalizeFit(enhancement.fit || enhancement.fitType) : base.fit
  const formalityScore = Number.isFinite(enhancement.formalityScore) ? Number(enhancement.formalityScore) : formalityFor(category, style)
  const warmthScore = Number.isFinite(enhancement.warmthScore) ? Number(enhancement.warmthScore) : warmthFor(category, enhancement.material || base.material)

  return {
    ...base,
    ...enhancement,
    category,
    style,
    season,
    fit,
    fitType: fit,
    primaryColor: colors[0] || base.primaryColor || 'unknown',
    secondaryColors: colors.slice(1),
    color: colors[0] || base.color || 'unknown',
    colors,
    formalityScore: Math.max(0, Math.min(100, formalityScore)),
    warmthScore: Math.max(0, Math.min(100, warmthScore)),
    occasion: enhancement.occasion?.length ? enhancement.occasion : occasionsFor(category, style, formalityScore),
    tags: [...new Set([...(enhancement.tags || []), ...base.tags, style, season, category, fit].filter(Boolean))]
  }
}
