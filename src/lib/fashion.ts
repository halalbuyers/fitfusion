export type ClothingCategory =
  | 't-shirt'
  | 'shirt'
  | 'hoodie'
  | 'jacket'
  | 'jeans'
  | 'pants'
  | 'cargos'
  | 'shorts'
  | 'shoes'
  | 'sneakers'
  | 'accessories'
  | 'watch'

export type WardrobeItem = {
  _id?: string
  id?: string
  image?: string
  category: string
  color?: string
  colors?: string[]
  style?: string
  season?: string
  occasion?: string[]
  occasions?: string[]
  tags?: string[]
  brand?: string
  fitType?: string
  material?: string
  isFavorite?: boolean
  usageCount?: number
}

export type OutfitRequest = {
  occasion?: string
  weather?: string
  temperature?: number
  stylePreference?: string
  season?: string
}

export type GeneratedLocalOutfit = {
  title: string
  occasion: string
  items: WardrobeItem[]
  score: number
  tags: string[]
  colorAnalysis: string
  explanation: string
  breakdown: Record<string, number>
}

const categoryKeywords = [
  ['hoodie', ['hoodie', 'sweatshirt', 'pullover']],
  ['sneakers', ['sneaker', 'trainer', 'high top', 'high-top']],
  ['shoes', ['shoe', 'boot', 'loafer', 'heel']],
  ['cargos', ['cargo']],
  ['jeans', ['jean', 'denim']],
  ['shorts', ['short']],
  ['jacket', ['jacket', 'coat', 'blazer', 'parka', 'overshirt']],
  ['shirt', ['shirt', 'button', 'oxford']],
  ['pants', ['pant', 'trouser', 'chino']],
  ['watch', ['watch']],
  ['accessories', ['cap', 'belt', 'bag', 'scarf', 'accessory', 'chain', 'ring']],
  ['t-shirt', ['tee', 'tshirt', 't-shirt']]
] as const

const colorKeywords = [
  'black',
  'white',
  'gray',
  'charcoal',
  'navy',
  'blue',
  'brown',
  'beige',
  'tan',
  'cream',
  'green',
  'olive',
  'red',
  'burgundy',
  'pink',
  'yellow',
  'orange',
  'purple'
]

const neutralColors = new Set(['black', 'white', 'gray', 'charcoal', 'navy', 'brown', 'beige', 'tan', 'cream'])
const warmColors = new Set(['red', 'burgundy', 'orange', 'yellow', 'brown', 'tan', 'cream', 'pink'])
const coolColors = new Set(['blue', 'navy', 'green', 'olive', 'purple', 'gray', 'charcoal'])
const universalColors = new Set(['black', 'white'])

const complementaryPairs = [
  ['blue', 'orange'],
  ['navy', 'tan'],
  ['green', 'red'],
  ['olive', 'cream'],
  ['purple', 'yellow'],
  ['brown', 'blue'],
  ['charcoal', 'white'],
  ['black', 'white']
]

const styleAliases: Record<string, string[]> = {
  streetwear: ['street', 'streetwear', 'oversized', 'graphic', 'cargo', 'sneaker', 'denim'],
  minimal: ['minimal', 'clean', 'plain', 'quiet', 'essential'],
  formal: ['formal', 'tailored', 'blazer', 'oxford', 'smart'],
  athleisure: ['gym', 'sport', 'athletic', 'performance', 'active'],
  vintage: ['vintage', 'retro', 'washed'],
  luxury: ['luxury', 'premium', 'leather', 'silk']
}

const occasionRules: Record<string, string[]> = {
  casual: ['t-shirt', 'shirt', 'hoodie', 'jeans', 'pants', 'cargos', 'sneakers', 'shoes'],
  college: ['t-shirt', 'shirt', 'hoodie', 'jeans', 'cargos', 'sneakers', 'backpack', 'accessories'],
  gym: ['t-shirt', 'shorts', 'pants', 'sneakers', 'hoodie'],
  party: ['shirt', 'jacket', 'jeans', 'pants', 'sneakers', 'shoes', 'accessories'],
  formal: ['shirt', 'jacket', 'pants', 'shoes', 'watch'],
  travel: ['t-shirt', 'hoodie', 'jacket', 'cargos', 'pants', 'sneakers'],
  'date night': ['shirt', 'jacket', 'jeans', 'pants', 'shoes', 'sneakers', 'watch']
}

function normalize(value?: string) {
  return String(value || '').trim().toLowerCase()
}

function itemColors(item: WardrobeItem) {
  const colors = (item.colors?.length ? item.colors : [item.color || 'black']).map(normalize).filter(Boolean)
  return colors.length ? colors : ['black']
}

function itemOccasions(item: WardrobeItem) {
  return [...(item.occasion || []), ...(item.occasions || []), ...(item.tags || [])].map(normalize)
}

export function analyzeClothing(input: string) {
  const text = input.toLowerCase()
  const category = categoryKeywords.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] || 'accessories'
  const colors = colorKeywords.filter((color) => text.includes(color))
  const style = Object.entries(styleAliases).find(([, aliases]) => aliases.some((alias) => text.includes(alias)))?.[0] || 'minimal'
  const season = text.includes('wool') || text.includes('hoodie') || text.includes('coat') || text.includes('jacket')
    ? 'winter'
    : text.includes('linen') || text.includes('short') || text.includes('tee')
      ? 'summer'
      : 'all-season'
  const fitType = text.includes('oversized') ? 'oversized' : text.includes('slim') ? 'slim' : text.includes('relaxed') ? 'relaxed' : ''
  const material = ['denim', 'cotton', 'wool', 'linen', 'leather', 'fleece', 'nylon'].find((word) => text.includes(word)) || ''

  return {
    category,
    colors: colors.length ? colors : ['black'],
    color: colors[0] || 'black',
    style,
    season,
    occasion: Object.keys(occasionRules).filter((occasion) => text.includes(occasion)),
    tags: [style, season, category, fitType, material].filter(Boolean),
    fitType,
    material
  }
}

export function colorScore(items: WardrobeItem[]) {
  const colors = [...new Set(items.flatMap(itemColors))]
  let score = 10

  const neutralCount = colors.filter((color) => neutralColors.has(color)).length
  const universalCount = colors.filter((color) => universalColors.has(color)).length
  score += Math.min(18, neutralCount * 6 + universalCount * 4)

  const hasComplement = complementaryPairs.some(([a, b]) => colors.includes(a) && colors.includes(b))
  if (hasComplement) score += 10
  if (colors.length === 1) score += 10
  if (colors.length === 2 || colors.length === 3) score += 8
  if (colors.length > 4) score -= 8

  const warm = colors.some((color) => warmColors.has(color))
  const cool = colors.some((color) => coolColors.has(color))
  if (warm && cool && !hasComplement && neutralCount < 2) score -= 6

  return Math.max(0, Math.min(40, score))
}

function styleScore(items: WardrobeItem[], preferred?: string) {
  const styles = items.map((item) => normalize(item.style || item.tags?.[0])).filter(Boolean)
  const uniqueStyles = [...new Set(styles)]
  let score = uniqueStyles.length <= 1 ? 25 : uniqueStyles.length === 2 ? 19 : 12
  if (preferred && uniqueStyles.includes(normalize(preferred))) score += 4
  if (styles.includes('streetwear') && items.some((item) => ['cargos', 'hoodie', 'sneakers'].includes(normalize(item.category)))) score += 3
  return Math.min(25, score)
}

function seasonScore(items: WardrobeItem[], request: OutfitRequest) {
  const requestedSeason = normalize(request.season)
  const temp = request.temperature
  let score = 12
  if (requestedSeason) {
    score += items.filter((item) => ['all-season', requestedSeason].includes(normalize(item.season))).length * 2
  }
  if (typeof temp === 'number') {
    const hasLayer = items.some((item) => ['hoodie', 'jacket'].includes(normalize(item.category)))
    const hasLight = items.some((item) => ['t-shirt', 'shirt', 'shorts'].includes(normalize(item.category)))
    if (temp <= 14 && hasLayer) score += 6
    if (temp >= 26 && hasLight && !items.some((item) => normalize(item.category) === 'jacket')) score += 6
    if (temp >= 28 && items.some((item) => normalize(item.category) === 'hoodie')) score -= 5
  }
  return Math.max(0, Math.min(20, score))
}

function occasionScore(items: WardrobeItem[], occasion?: string) {
  const normalizedOccasion = normalize(occasion || 'casual')
  const allowed = occasionRules[normalizedOccasion] || occasionRules.casual
  let score = 8
  score += items.filter((item) => allowed.includes(normalize(item.category))).length * 2
  score += items.filter((item) => itemOccasions(item).includes(normalizedOccasion)).length * 2
  if (normalizedOccasion === 'formal' && items.some((item) => normalize(item.category) === 'hoodie')) score -= 6
  if (normalizedOccasion === 'gym' && items.some((item) => normalize(item.category) === 'jacket')) score -= 4
  return Math.max(0, Math.min(15, score))
}

function weatherScore(items: WardrobeItem[], request: OutfitRequest) {
  const weather = normalize(request.weather)
  let score = 6
  if (weather.includes('rain') || weather.includes('storm')) {
    if (items.some((item) => normalize(item.category) === 'jacket')) score += 5
    if (items.some((item) => ['sneakers', 'shoes'].includes(normalize(item.category)))) score += 2
  }
  if (weather.includes('cold') || weather.includes('winter')) {
    if (items.some((item) => ['hoodie', 'jacket'].includes(normalize(item.category)))) score += 5
  }
  if (weather.includes('hot') || weather.includes('sun')) {
    if (items.some((item) => ['t-shirt', 'shirt', 'shorts'].includes(normalize(item.category)))) score += 4
  }
  return Math.max(0, Math.min(10, score))
}

function trendScore(items: WardrobeItem[]) {
  const categories = items.map((item) => normalize(item.category))
  const has = (category: string) => categories.includes(category)
  let score = 4
  if ((has('hoodie') || has('t-shirt')) && has('cargos') && (has('sneakers') || has('shoes'))) score += 6
  if ((has('shirt') || has('jacket')) && (has('jeans') || has('pants')) && (has('sneakers') || has('shoes'))) score += 5
  if (items.some((item) => item.isFavorite)) score += 2
  return Math.min(10, score)
}

function hasCompleteBase(items: WardrobeItem[]) {
  const categories = items.map((item) => normalize(item.category))
  return categories.some((c) => ['t-shirt', 'shirt', 'hoodie', 'jacket'].includes(c))
    && categories.some((c) => ['jeans', 'pants', 'cargos', 'shorts'].includes(c))
    && categories.some((c) => ['shoes', 'sneakers'].includes(c))
}

export function scoreOutfit(items: WardrobeItem[], request: OutfitRequest = {}) {
  const breakdown = {
    color: colorScore(items),
    style: styleScore(items, request.stylePreference),
    season: seasonScore(items, request),
    occasion: occasionScore(items, request.occasion),
    weather: weatherScore(items, request),
    trend: trendScore(items)
  }
  const completenessPenalty = hasCompleteBase(items) ? 0 : 10
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0) - completenessPenalty
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    breakdown
  }
}

export function compatibilityScore(items: WardrobeItem[], request: OutfitRequest) {
  return scoreOutfit(items, request).score - colorScore(items)
}

function buildExplanation(items: WardrobeItem[], request: OutfitRequest, breakdown: Record<string, number>) {
  const colors = [...new Set(items.flatMap(itemColors))]
  const categories = items.map((item) => normalize(item.category)).filter(Boolean)
  const occasion = request.occasion || 'casual'
  const lead = colors.length <= 2
    ? `A tight ${colors.join(' and ')} palette keeps the fit clean.`
    : `${colors.slice(0, 3).join(', ')} gives the outfit contrast without losing balance.`
  const layer = categories.includes('jacket') || categories.includes('hoodie')
    ? 'The layer adds structure and makes the look weather-ready.'
    : 'The silhouette stays light, easy, and wearable.'
  return `${lead} ${layer} Style cohesion scored ${breakdown.style}/25 for ${occasion}.`
}

function uniqueById(outfits: WardrobeItem[][]) {
  const seen = new Set<string>()
  return outfits.filter((combo) => {
    const key = combo.map((item) => String(item._id || item.id || item.image || item.category)).sort().join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function generateOutfits(items: WardrobeItem[], request: OutfitRequest = {}): GeneratedLocalOutfit[] {
  const tops = items.filter((item) => ['shirt', 't-shirt', 'hoodie'].includes(normalize(item.category)))
  const outerwear = items.filter((item) => normalize(item.category) === 'jacket')
  const bottoms = items.filter((item) => ['pants', 'jeans', 'cargos', 'shorts'].includes(normalize(item.category)))
  const shoes = items.filter((item) => ['shoes', 'sneakers'].includes(normalize(item.category)))
  const accessories = items.filter((item) => ['watch', 'accessories'].includes(normalize(item.category)))
  const candidates: WardrobeItem[][] = []

  for (const top of tops.slice(0, 12)) {
    for (const bottom of bottoms.slice(0, 12)) {
      for (const shoe of shoes.slice(0, 8)) {
        candidates.push([top, bottom, shoe])
        for (const accessory of accessories.slice(0, 2)) candidates.push([top, bottom, shoe, accessory])
        for (const layer of outerwear.slice(0, 4)) candidates.push([top, layer, bottom, shoe])
      }
    }
  }

  if (!candidates.length && items.length) candidates.push(items.slice(0, 4))

  return uniqueById(candidates)
    .map((combo, index) => {
      const { score, breakdown } = scoreOutfit(combo, request)
      const colors = [...new Set(combo.flatMap(itemColors))]
      const mainStyle = request.stylePreference || combo.find((item) => item.style)?.style || 'minimal'
      return {
        title: `${request.occasion || ['Casual', 'Street', 'Travel', 'Studio'][index % 4]} fit ${index + 1}`,
        occasion: request.occasion || 'casual',
        items: combo,
        score,
        tags: [...new Set([request.occasion || 'casual', mainStyle, ...combo.flatMap((item) => item.tags || [])])].slice(0, 8),
        colorAnalysis: `${colors.join(', ')} palette with ${breakdown.color}/40 color harmony.`,
        explanation: buildExplanation(combo, request, breakdown),
        breakdown
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
}
