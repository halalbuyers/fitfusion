import { getPaletteCompatibilityScore, isLuxuryPalette, normalizeColors } from './color-engine'
import { legacyCategory, normalizeCategory, normalizeStyle } from './fashion-analysis'
import { explainOutfitLocally } from './outfit-explainer'
import { emptyPreferenceProfile, preferenceBoost, type UserPreferenceProfile } from './preference-engine'
import { analyzeWeather, outfitLayerCount, outfitWarmthScore, scoreWeatherFit, validateOutfitWeather, weatherPenalty } from './weather-engine'

export type OutfitType = 'casual' | 'college' | 'date' | 'party' | 'gym' | 'formal' | 'travel' | 'winter' | 'summer' | 'monochrome' | 'luxury' | 'streetwear'

export type WardrobeEngineItem = {
  _id?: string
  id?: string
  image?: string
  category: string
  primaryColor?: string
  secondaryColors?: string[]
  color?: string
  colors?: string[]
  style?: string
  season?: string
  fit?: string
  fitType?: string
  formalityScore?: number
  warmthScore?: number
  material?: string
  tags?: string[]
  favorite?: boolean
  isFavorite?: boolean
  wearCount?: number
  usageCount?: number
  lastWornAt?: Date | string | null
}

export type OutfitRequest = {
  occasion?: OutfitType | string
  weather?: string
  temperature?: number
  season?: string
  stylePreference?: string
  preferences?: UserPreferenceProfile
  recentlyGenerated?: string[]
  generationHistory?: string[]
  itemUsageCount?: Record<string, number>
  rejectedOutfitKeys?: string[]
  previousOutfitKeys?: string[]
  limit?: number
}

export type OutfitScoreBreakdown = {
  colorScore: number
  styleScore: number
  seasonScore: number
  occasionScore: number
  balanceScore: number
  personalization: number
  weatherScore: number
  diversityScore: number
  memoryPenalty: number
  weatherPenalty: number
}

export type GeneratedOutfit = {
  title: string
  occasion: string
  items: WardrobeEngineItem[]
  score: number
  tags: string[]
  colorAnalysis: string
  explanation: string
  breakdown: OutfitScoreBreakdown
  outfitKey: string
  confidence: number
}

const outfitTypeRules: Record<string, { styles: string[]; minFormality: number; maxFormality: number; categories: string[]; avoid: string[] }> = {
  casual: { styles: ['casual', 'minimal', 'streetwear'], minFormality: 15, maxFormality: 75, categories: ['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'shorts', 'sneakers'], avoid: [] },
  college: { styles: ['casual', 'minimal', 'streetwear', 'sporty'], minFormality: 10, maxFormality: 65, categories: ['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'sneakers'], avoid: ['boots'] },
  date: { styles: ['minimal', 'casual', 'old-money', 'formal'], minFormality: 38, maxFormality: 82, categories: ['shirt', 'jacket', 'jeans', 'cargo', 'sneakers', 'boots', 'accessories'], avoid: ['shorts'] },
  party: { styles: ['streetwear', 'y2k', 'minimal', 'formal'], minFormality: 35, maxFormality: 88, categories: ['shirt', 'jacket', 'jeans', 'cargo', 'sneakers', 'boots', 'accessories'], avoid: [] },
  gym: { styles: ['sporty', 'casual'], minFormality: 0, maxFormality: 45, categories: ['tshirt', 'hoodie', 'shorts', 'sneakers'], avoid: ['jacket', 'boots'] },
  formal: { styles: ['formal', 'minimal', 'old-money'], minFormality: 65, maxFormality: 100, categories: ['shirt', 'jacket', 'jeans', 'boots', 'accessories'], avoid: ['hoodie', 'shorts'] },
  travel: { styles: ['casual', 'streetwear', 'techwear', 'minimal'], minFormality: 10, maxFormality: 70, categories: ['tshirt', 'hoodie', 'jacket', 'cargo', 'jeans', 'sneakers', 'boots'], avoid: [] },
  winter: { styles: ['streetwear', 'minimal', 'techwear', 'casual'], minFormality: 10, maxFormality: 90, categories: ['hoodie', 'jacket', 'jeans', 'cargo', 'boots', 'sneakers'], avoid: ['shorts'] },
  summer: { styles: ['casual', 'minimal', 'old-money', 'sporty'], minFormality: 5, maxFormality: 75, categories: ['tshirt', 'shirt', 'shorts', 'jeans', 'sneakers', 'accessories'], avoid: ['jacket', 'boots'] },
  monochrome: { styles: ['minimal', 'streetwear', 'formal'], minFormality: 20, maxFormality: 95, categories: ['tshirt', 'shirt', 'hoodie', 'jacket', 'jeans', 'cargo', 'sneakers', 'boots'], avoid: [] },
  luxury: { styles: ['minimal', 'formal', 'old-money'], minFormality: 45, maxFormality: 100, categories: ['shirt', 'jacket', 'jeans', 'boots', 'accessories', 'sneakers'], avoid: ['shorts'] },
  streetwear: { styles: ['streetwear', 'y2k', 'techwear'], minFormality: 5, maxFormality: 65, categories: ['tshirt', 'hoodie', 'jacket', 'cargo', 'jeans', 'sneakers', 'accessories'], avoid: [] }
}

const styleConflicts: Array<[string, string, number]> = [
  ['formal', 'sporty', 24],
  ['formal', 'y2k', 14],
  ['old-money', 'techwear', 16],
  ['minimal', 'y2k', 8],
  ['sporty', 'old-money', 14]
]

function itemId(item: WardrobeEngineItem) {
  return String(item._id || item.id || item.image || `${item.category}-${item.primaryColor || item.color}`)
}

export function outfitKey(items: WardrobeEngineItem[]) {
  return items.map(itemId).sort().join('|')
}

function itemKey(item: WardrobeEngineItem) {
  return itemId(item)
}

function outfitStructureKey(items: WardrobeEngineItem[]) {
  const byRole = items.reduce<Record<string, string[]>>((acc, item) => {
    const itemRole = role(item.category)
    const category = normalizeCategory(item.category)
    acc[itemRole] = [...(acc[itemRole] || []), category]
    return acc
  }, {})

  return Object.entries(byRole)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([itemRole, categories]) => `${itemRole}:${categories.sort().join(',')}`)
    .join('|')
}

function itemColors(item: WardrobeEngineItem) {
  const explicit = [item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])].filter((color) => color && color !== 'unknown')
  return explicit.length ? normalizeColors(explicit) : []
}

function role(category: string) {
  const normalized = normalizeCategory(category)
  if (['tshirt', 'shirt', 'hoodie'].includes(normalized)) return 'top'
  if (normalized === 'jacket') return 'layer'
  if (['jeans', 'cargo', 'shorts'].includes(normalized)) return 'bottom'
  if (['sneakers', 'boots'].includes(normalized)) return 'shoes'
  return 'accessory'
}

function uniqueRoles(items: WardrobeEngineItem[]) {
  const categories = items.map((item) => normalizeCategory(item.category))
  return new Set(categories).size === categories.length
}

function styleScore(items: WardrobeEngineItem[], request: OutfitRequest) {
  const styles = items.map((item) => normalizeStyle(item.style)).filter(Boolean)
  const unique = [...new Set(styles)]
  let score = unique.length <= 1 ? 92 : unique.length === 2 ? 78 : 55
  const occasion = String(request.occasion || 'casual').toLowerCase()
  const rules = outfitTypeRules[occasion] || outfitTypeRules.casual
  score += styles.filter((style) => rules.styles.includes(style)).length * 4
  if (request.stylePreference && unique.includes(normalizeStyle(request.stylePreference))) score += 8
  if (occasion === 'streetwear' && items.some((item) => ['hoodie', 'cargo', 'sneakers'].includes(normalizeCategory(item.category)))) score += 8
  for (const [a, b, penalty] of styleConflicts) {
    if (unique.includes(a as any) && unique.includes(b as any)) score -= penalty
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

function seasonScore(items: WardrobeEngineItem[], request: OutfitRequest) {
  const occasion = String(request.occasion || '').toLowerCase()
  const requestedSeason = String(request.season || (['winter', 'summer'].includes(occasion) ? occasion : '')).toLowerCase()
  const weather = analyzeWeather({ condition: request.weather, temperature: request.temperature, season: requestedSeason || request.season })
  const categories = items.map((item) => normalizeCategory(item.category))
  let score = scoreWeatherFit(items, { condition: request.weather, temperature: request.temperature, season: requestedSeason || request.season })

  if (requestedSeason) {
    const matches = items.filter((item) => ['all-season', requestedSeason].includes(String(item.season || 'all-season').toLowerCase())).length
    score = (score + (matches / Math.max(1, items.length)) * 100) / 2
  }

  if (weather.needsLayer && categories.some((category) => ['hoodie', 'jacket'].includes(category))) score += 8
  if (weather.avoidHeavyLayers && categories.some((category) => ['jacket', 'hoodie', 'boots'].includes(category))) score -= 45
  if ((requestedSeason === 'winter' || String(request.weather).includes('cold')) && categories.includes('shorts')) score -= 80
  if ((requestedSeason === 'summer' || String(request.weather).includes('hot')) && categories.some((category) => ['hoodie', 'jacket'].includes(category))) score -= 100
  if (requestedSeason === 'summer') {
    score += categories.filter((category) => ['tshirt', 'shirt', 'shorts', 'sneakers'].includes(category)).length * 7
    score -= categories.filter((category) => ['hoodie', 'jacket', 'boots'].includes(category)).length * 55
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function occasionScore(items: WardrobeEngineItem[], occasion = 'casual') {
  const rules = outfitTypeRules[String(occasion).toLowerCase()] || outfitTypeRules.casual
  const categories = items.map((item) => normalizeCategory(item.category))
  const avgFormality = items.reduce((sum, item) => sum + Number(item.formalityScore || 45), 0) / Math.max(1, items.length)
  let score = 70
  score += categories.filter((category) => rules.categories.includes(category)).length * 5
  score -= categories.filter((category) => rules.avoid.includes(category)).length * 16
  if (avgFormality < rules.minFormality) score -= rules.minFormality - avgFormality
  if (avgFormality > rules.maxFormality) score -= avgFormality - rules.maxFormality
  return Math.max(0, Math.min(100, Math.round(score)))
}

function balanceScore(items: WardrobeEngineItem[], request: OutfitRequest) {
  const roles = items.map((item) => role(item.category))
  let score = 55
  if (roles.includes('top')) score += 12
  if (roles.includes('bottom')) score += 12
  if (roles.includes('shoes')) score += 12
  if (roles.includes('layer')) score += 4
  if (roles.filter((value) => value === 'accessory').length <= 1) score += 5
  if (!uniqueRoles(items)) score -= 20
  if (roles.filter((value) => value === 'layer').length > 1) score -= 18
  if (roles.includes('layer') && !roles.includes('top')) score -= 12
  const colors = [...new Set(items.flatMap(itemColors))]
  if (String(request.occasion).toLowerCase() === 'monochrome' && colors.length <= 2) score += 15
  if (String(request.occasion).toLowerCase() === 'luxury' && isLuxuryPalette(colors)) score += 15
  return Math.max(0, Math.min(100, Math.round(score)))
}

function recentlyWornPenalty(items: WardrobeEngineItem[]) {
  const now = Date.now()
  return items.reduce((penalty, item) => {
    if (!item.lastWornAt) return penalty
    const days = (now - new Date(item.lastWornAt).getTime()) / 86400000
    if (Number.isNaN(days)) return penalty
    if (days <= 2) return penalty + 5
    if (days <= 7) return penalty + 2
    return penalty
  }, 0)
}

function diversityScore(items: WardrobeEngineItem[], request: OutfitRequest) {
  const currentKey = outfitKey(items)
  const itemUsage = request.itemUsageCount || {}
  const recentlyGenerated = new Set([...(request.recentlyGenerated || []), ...(request.previousOutfitKeys || [])])
  const generationHistory = new Set(request.generationHistory || [])
  const usagePenalty = items.reduce((sum, item) => sum + Number(itemUsage[itemKey(item)] || item.usageCount || item.wearCount || 0) * 5, 0)
  const exactPenalty = recentlyGenerated.has(currentKey) ? 30 : generationHistory.has(currentKey) ? 18 : 0
  const averagePenalty = usagePenalty / Math.max(1, items.length)
  return Math.max(0, Math.min(100, Math.round(100 - averagePenalty - exactPenalty)))
}

function confidenceScore(items: WardrobeEngineItem[]) {
  const itemScores = items.map((item) => {
    let score = 30
    if (normalizeCategory(item.category) !== 'unknown') score += 20
    if (itemColors(item).length) score += 20
    if (item.style && normalizeStyle(item.style)) score += 14
    if (item.season) score += 8
    if (typeof item.formalityScore === 'number') score += 4
    if (typeof item.warmthScore === 'number') score += 4
    return Math.min(100, score)
  })
  return Math.round(itemScores.reduce((sum, value) => sum + value, 0) / Math.max(1, itemScores.length))
}

export function scoreOutfit(items: WardrobeEngineItem[], request: OutfitRequest = {}) {
  const colors = items.flatMap(itemColors)
  const currentOutfitKey = outfitKey(items)
  const memoryPenalty = (request.previousOutfitKeys || []).includes(currentOutfitKey) ? 18 : 0
  const occasion = String(request.occasion || '').toLowerCase()
  const season = request.season || (['winter', 'summer'].includes(occasion) ? occasion : undefined)
  const validation = validateOutfitWeather(items, { condition: request.weather, temperature: request.temperature, season })
  const weatherScore = validation.valid ? scoreWeatherFit(items, { condition: request.weather, temperature: request.temperature, season }) : 0
  const breakdown: OutfitScoreBreakdown = {
    colorScore: colors.length ? getPaletteCompatibilityScore(colors) : 50,
    styleScore: styleScore(items, request),
    seasonScore: seasonScore(items, request),
    occasionScore: occasionScore(items, request.occasion || 'casual'),
    balanceScore: balanceScore(items, request),
    personalization: preferenceBoost(items, request.preferences || emptyPreferenceProfile),
    weatherScore,
    diversityScore: diversityScore(items, request),
    memoryPenalty: memoryPenalty + recentlyWornPenalty(items),
    weatherPenalty: validation.valid ? weatherPenalty(items, { condition: request.weather, temperature: request.temperature, season }) : 1000
  }
  const preferenceScore = Math.max(0, Math.min(100, 50 + breakdown.personalization * 2))
  const weighted =
    breakdown.colorScore * 0.35 +
    breakdown.styleScore * 0.25 +
    breakdown.weatherScore * 0.15 +
    breakdown.seasonScore * 0.10 +
    preferenceScore * 0.10 +
    breakdown.diversityScore * 0.05 +
    breakdown.occasionScore * 0.04 +
    breakdown.balanceScore * 0.04 -
    breakdown.memoryPenalty -
    breakdown.weatherPenalty

  return {
    score: validation.valid ? Math.max(0, Math.min(100, Math.round(weighted))) : 0,
    breakdown,
    confidence: confidenceScore(items)
  }
}

function titleFor(items: WardrobeEngineItem[], occasion: string, index: number) {
  const style = normalizeStyle(items.find((item) => item.style)?.style)
  return `${style} ${occasion} fit ${index + 1}`
}

function explanationFor(items: WardrobeEngineItem[], occasion: string, score: number, breakdown: OutfitScoreBreakdown, request: OutfitRequest) {
  const colors = [...new Set(items.flatMap(itemColors))]
  const styles = [...new Set(items.map((item) => normalizeStyle(item.style)))]
  const categories = items.map((item) => legacyCategory(item.category)).join(', ')
  const palette = colors.length <= 2 ? `${colors.join(' and ')} palette` : `${colors.slice(0, 3).join(', ')} palette`
  return explainOutfitLocally({ items, occasion, score, breakdown }, { condition: request.weather, temperature: request.temperature, season: request.season })
    || `This ${occasion} outfit works because the ${palette} keeps the pieces cohesive, while ${categories} create a balanced silhouette. The style match scored ${breakdown.styleScore}/100 across ${styles.join(' and ')} cues.`
}

function topCandidates(items: WardrobeEngineItem[], categories: string[], limit: number) {
  return items
    .filter((item) => categories.includes(normalizeCategory(item.category)))
    .sort((a, b) => {
      const aScore = Number(a.favorite || a.isFavorite) * 12 - Number(a.usageCount || a.wearCount || 0) * 5 + Math.random() * 8
      const bScore = Number(b.favorite || b.isFavorite) * 12 - Number(b.usageCount || b.wearCount || 0) * 5 + Math.random() * 8
      return bScore - aScore
    })
    .slice(0, limit)
}

function sampleTop<T>(items: T[], limit: number) {
  const pool = items.slice(0, Math.max(limit, Math.min(items.length, 5)))
  return [...pool].sort(() => Math.random() - 0.5).slice(0, limit)
}

function weatherContextForRequest(request: OutfitRequest, occasion: string) {
  return {
    condition: request.weather,
    temperature: request.temperature,
    season: request.season || (['winter', 'summer'].includes(occasion) ? occasion : undefined)
  }
}

function logWeatherRejection(items: WardrobeEngineItem[], request: OutfitRequest, occasion: string) {
  const validation = validateOutfitWeather(items, weatherContextForRequest(request, occasion))
  if (validation.valid) return validation
  console.info('[FitFusion outfit weather rejection]', {
    Weather: validation.weather,
    Season: validation.season,
    LayerCount: validation.layerCount,
    WarmthScore: validation.warmthScore,
    RejectedReason: validation.reason,
    Items: items.map((item) => legacyCategory(item.category))
  })
  return validation
}

export function generateOutfits(items: WardrobeEngineItem[], request: OutfitRequest = {}): GeneratedOutfit[] {
  const occasion = String(request.occasion || 'casual').toLowerCase()
  const tops = sampleTop(topCandidates(items, ['tshirt', 'shirt', 'hoodie'], 18), 10)
  const layers = sampleTop(topCandidates(items, ['jacket'], 8), 4)
  const bottoms = sampleTop(topCandidates(items, ['jeans', 'cargo', 'shorts'], 18), 10)
  const shoes = sampleTop(topCandidates(items, ['sneakers', 'boots'], 12), 6)
  const accessories = sampleTop(topCandidates(items, ['accessories'], 6), 3)
  const candidates: WardrobeEngineItem[][] = []

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        candidates.push([top, bottom, shoe])
        for (const accessory of accessories.slice(0, 2)) candidates.push([top, bottom, shoe, accessory])
        for (const layer of layers) candidates.push([top, layer, bottom, shoe])
      }
    }
  }

  if (!candidates.length && items.length >= 2) candidates.push(items.slice(0, 4))

  const rejected = new Set([...(request.rejectedOutfitKeys || []), ...(request.preferences?.rejectedOutfitKeys || [])])
  const seen = new Set<string>()

  const scored = candidates
    .sort(() => Math.random() - 0.5)
    .filter(uniqueRoles)
    .filter((combo) => {
      const key = outfitKey(combo)
      if (seen.has(key) || rejected.has(key)) return false
      seen.add(key)
      return true
    })
    .filter((combo) => logWeatherRejection(combo, request, occasion).valid)
    .map((combo, index) => {
      const { score, breakdown, confidence } = scoreOutfit(combo, request)
      const colors = [...new Set(combo.flatMap(itemColors))]
      const validation = validateOutfitWeather(combo, weatherContextForRequest(request, occasion))
      const tags = [...new Set([occasion, validation.weather, `${outfitLayerCount(combo)} layers`, `warmth ${outfitWarmthScore(combo)}`, ...combo.map((item) => normalizeStyle(item.style)), ...combo.flatMap((item) => item.tags || [])])].slice(0, 8)
      return {
        title: titleFor(combo, occasion, index),
        occasion,
        items: combo,
        score,
        tags,
        colorAnalysis: `${colors.join(', ')} palette scored ${breakdown.colorScore}/100 for color compatibility.`,
        explanation: explanationFor(combo, occasion, score, breakdown, request),
        breakdown,
        outfitKey: outfitKey(combo),
        confidence
      }
    })
    .sort((a, b) => b.score - a.score)

  const unique: GeneratedOutfit[] = []
  const structures = new Map<string, number>()
  const usedItems = new Set<string>()
  const maxResults = request.limit || 5

  for (const outfit of scored) {
    const structure = outfitStructureKey(outfit.items)
    const repeatedItems = outfit.items.filter((item) => usedItems.has(itemKey(item))).length
    if ((structures.get(structure) || 0) >= 1 && repeatedItems >= Math.max(1, outfit.items.length - 1)) continue
    if ((structures.get(structure) || 0) >= 2) continue
    unique.push(outfit)
    structures.set(structure, (structures.get(structure) || 0) + 1)
    outfit.items.forEach((item) => usedItems.add(itemKey(item)))
    if (unique.length >= maxResults) break
  }

  return unique.length ? unique : scored.slice(0, maxResults)
}
