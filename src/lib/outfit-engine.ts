import { getPaletteCompatibilityScore, isLuxuryPalette, normalizeColors } from './color-engine'
import { legacyCategory, normalizeCategory, normalizeStyle } from './fashion-analysis'
import { analyzeOutfitBalance, balanceRole } from './balance-engine'
import { itemKnowledgeKey, normalizeOccasion } from './fashion-knowledge'
import { occasionCategoryPools, scoreOccasionSuitability } from './occasion-engine'
import { explainOutfitLocally } from './outfit-explainer'
import { emptyPreferenceProfile, preferenceBoost, type UserPreferenceProfile } from './preference-engine'
import { analyzeWeather, outfitLayerCount, outfitWarmthScore, scoreWeatherFit, validateOutfitWeather, weatherPenalty } from './weather-engine'
import { scoreOutfitConfidence } from './ai/confidenceEngine'
import { explainStylistChoice } from './ai/explanationEngine'
import { detectMissingEssentials, type MissingWardrobeEssential } from './ai/recommendationEngine'
import { scoreStylistOutfit, type StylistScoreBreakdown } from './ai/scoringEngine'

export type OutfitType = 'casual' | 'office' | 'college' | 'party' | 'wedding' | 'date' | 'travel' | 'gym' | 'festival' | 'formal' | 'winter' | 'summer' | 'monochrome' | 'luxury' | 'streetwear'

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
  itemPreferenceScore?: number
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
  recentStructures?: string[]
  recentColorSignatures?: string[]
  itemUsageCount?: Record<string, number>
  rejectedOutfitKeys?: string[]
  previousOutfitKeys?: string[]
  rain?: boolean | number
  windKph?: number
  humidity?: number
  uvIndex?: number
  timeOfDay?: string
  boldFashion?: boolean
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
  fashionScore: number
  itemPreferenceScore: number
  aiColorHarmony?: number
  aiOccasionCompatibility?: number
  aiWeatherCompatibility?: number
  aiLayeringQuality?: number
  aiStyleConsistency?: number
  aiRecentlyWornPenalty?: number
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
  confidenceLabel?: string
  weatherMatch?: { score: number; label: string; condition: string; reasons: string[]; prefer: string[]; avoid: string[] }
  missingEssentials?: MissingWardrobeEssential[]
  reasoning: string[]
}

type ScoreOutfitResult = {
  score: number
  breakdown: OutfitScoreBreakdown
  confidence: number
  confidenceLabel: string
  reasoning: string[]
  weatherMatch: ReturnType<typeof scoreStylistOutfit>['weather']
  colorMatch: ReturnType<typeof scoreStylistOutfit>['color']
  layering: ReturnType<typeof scoreStylistOutfit>['layering']
}

const scoreCache = new Map<string, ScoreOutfitResult>()

const outfitTypeRules: Record<string, { styles: string[]; minFormality: number; maxFormality: number; categories: string[]; avoid: string[] }> = {
  casual: { styles: ['casual', 'minimal', 'streetwear'], minFormality: 15, maxFormality: 75, categories: ['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'shorts', 'dress', 'skirt', 'blouse', 'kurti', 'saree', 'sneakers', 'heels'], avoid: [] },
  college: { styles: ['casual', 'minimal', 'streetwear', 'sporty'], minFormality: 10, maxFormality: 65, categories: ['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'skirt', 'dress', 'blouse', 'kurti', 'saree', 'sneakers'], avoid: ['boots'] },
  date: { styles: ['minimal', 'casual', 'old-money', 'formal'], minFormality: 38, maxFormality: 82, categories: ['shirt', 'jacket', 'jeans', 'cargo', 'dress', 'skirt', 'blouse', 'kurti', 'saree', 'sneakers', 'boots', 'heels', 'handbag', 'accessories'], avoid: ['shorts'] },
  party: { styles: ['streetwear', 'y2k', 'minimal', 'formal'], minFormality: 35, maxFormality: 88, categories: ['shirt', 'jacket', 'jeans', 'cargo', 'dress', 'skirt', 'blouse', 'kurti', 'saree', 'sneakers', 'boots', 'heels', 'handbag', 'accessories'], avoid: [] },
  gym: { styles: ['sporty', 'casual'], minFormality: 0, maxFormality: 45, categories: ['tshirt', 'hoodie', 'shorts', 'sneakers'], avoid: ['jacket', 'boots'] },
  formal: { styles: ['formal', 'minimal', 'old-money'], minFormality: 65, maxFormality: 100, categories: ['shirt', 'jacket', 'jeans', 'dress', 'skirt', 'blouse', 'kurti', 'saree', 'boots', 'heels', 'handbag', 'accessories'], avoid: ['hoodie', 'shorts'] },
  travel: { styles: ['casual', 'streetwear', 'techwear', 'minimal'], minFormality: 10, maxFormality: 70, categories: ['tshirt', 'hoodie', 'jacket', 'cargo', 'jeans', 'skirt', 'dress', 'sneakers', 'boots', 'heels'], avoid: [] },
  winter: { styles: ['streetwear', 'minimal', 'techwear', 'casual'], minFormality: 10, maxFormality: 90, categories: ['hoodie', 'jacket', 'jeans', 'cargo', 'boots', 'sneakers', 'dress', 'skirt'], avoid: ['shorts'] },
  summer: { styles: ['casual', 'minimal', 'old-money', 'sporty'], minFormality: 5, maxFormality: 75, categories: ['tshirt', 'shirt', 'shorts', 'jeans', 'skirt', 'dress', 'blouse', 'sneakers', 'heels', 'accessories'], avoid: ['jacket', 'boots'] },
  monochrome: { styles: ['minimal', 'streetwear', 'formal'], minFormality: 20, maxFormality: 95, categories: ['tshirt', 'shirt', 'hoodie', 'jacket', 'jeans', 'cargo', 'dress', 'skirt', 'sneakers', 'boots', 'heels'], avoid: [] },
  luxury: { styles: ['minimal', 'formal', 'old-money'], minFormality: 45, maxFormality: 100, categories: ['shirt', 'jacket', 'jeans', 'dress', 'skirt', 'blouse', 'kurti', 'saree', 'boots', 'heels', 'handbag', 'accessories', 'sneakers'], avoid: ['shorts'] },
  streetwear: { styles: ['streetwear', 'y2k', 'techwear'], minFormality: 5, maxFormality: 65, categories: ['tshirt', 'hoodie', 'jacket', 'cargo', 'jeans', 'dress', 'skirt', 'sneakers', 'accessories'], avoid: [] }
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

export function outfitStructureKey(items: WardrobeEngineItem[]) {
  const byRole = items.reduce<Record<string, string[]>>((acc, item) => {
    const itemRole = role(item.category, item)
    const category = itemKnowledgeKey(item)
    acc[itemRole] = [...(acc[itemRole] || []), category]
    return acc
  }, {})

  return Object.entries(byRole)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([itemRole, categories]) => `${itemRole}:${categories.sort().join(',')}`)
    .join('|')
}

export function outfitColorSignature(items: WardrobeEngineItem[]) {
  const colors = [...new Set(items.flatMap(itemColors))]
  return colors.sort().slice(0, 4).join('+') || 'no-color'
}

function itemColors(item: WardrobeEngineItem) {
  const explicit = [item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])].filter((color) => color && color !== 'unknown')
  return explicit.length ? normalizeColors(explicit) : []
}

function role(category: string, item?: WardrobeEngineItem) {
  if (item) return balanceRole(item)
  const normalized = normalizeCategory(category)
  if (['tshirt', 'shirt', 'hoodie', 'blouse', 'dress', 'kurti', 'saree'].includes(normalized)) return 'top'
  if (normalized === 'jacket') return 'layer'
  if (['jeans', 'cargo', 'shorts', 'skirt', 'pants'].includes(normalized)) return 'bottom'
  if (['sneakers', 'boots', 'heels'].includes(normalized)) return 'shoes'
  return 'accessory'
}

function uniqueRoles(items: WardrobeEngineItem[]) {
  const categories = items.map((item) => `${role(item.category, item)}:${itemKnowledgeKey(item)}`)
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
  return scoreOccasionSuitability(items, occasion).score
}

function balanceScore(items: WardrobeEngineItem[], request: OutfitRequest) {
  const roles = items.map((item) => role(item.category, item))
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
  return Math.max(0, Math.min(100, Math.round((score + analyzeOutfitBalance(items).score) / 2)))
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
  const currentStructure = outfitStructureKey(items)
  const currentColors = outfitColorSignature(items)
  const itemUsage = request.itemUsageCount || {}
  const recentlyGenerated = new Set([...(request.recentlyGenerated || []), ...(request.previousOutfitKeys || [])])
  const generationHistory = new Set(request.generationHistory || [])
  const recentStructures = new Set(request.recentStructures || [])
  const recentColors = new Set(request.recentColorSignatures || [])
  const usagePenalty = items.reduce((sum, item) => sum + Number(itemUsage[itemKey(item)] || item.usageCount || item.wearCount || 0) * 5, 0)
  const exactPenalty = recentlyGenerated.has(currentKey) ? 30 : generationHistory.has(currentKey) ? 18 : 0
  const structurePenalty = recentStructures.has(currentStructure) ? 20 : 0
  const colorPenalty = recentColors.has(currentColors) ? 14 : 0
  const averagePenalty = usagePenalty / Math.max(1, items.length)
  return Math.max(0, Math.min(100, Math.round(100 - averagePenalty - exactPenalty - structurePenalty - colorPenalty)))
}

function learnedItemScore(items: WardrobeEngineItem[], request: OutfitRequest) {
  const preferred = new Set(request.preferences?.favoriteItems || [])
  const rejected = new Set(request.preferences?.rejectedItems || [])
  const overused = new Set(request.preferences?.overusedItems || [])
  let score = items.reduce((sum, item) => {
    const id = itemKey(item)
    let value = Number(item.itemPreferenceScore || 0)
    if (preferred.has(id)) value += 4
    if (rejected.has(id)) value -= 10
    if (overused.has(id)) value -= 2
    return sum + value
  }, 0)
  score = score / Math.max(1, items.length)
  return Math.max(-30, Math.min(30, Math.round(score)))
}

function confidenceScore(items: WardrobeEngineItem[], breakdown?: OutfitScoreBreakdown) {
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
  const metadataScore = itemScores.reduce((sum, value) => sum + value, 0) / Math.max(1, itemScores.length)
  if (!breakdown) return Math.round(metadataScore)
  const scoreAverage = (
    breakdown.weatherScore +
    breakdown.occasionScore +
    breakdown.balanceScore +
    breakdown.styleScore +
    Math.max(0, Math.min(100, 50 + breakdown.personalization * 2))
  ) / 5
  return Math.max(0, Math.min(100, Math.round(metadataScore * 0.35 + scoreAverage * 0.65)))
}

function confidenceLabel(score: number) {
  if (score >= 90) return 'Very Confident'
  if (score >= 76) return 'Confident'
  if (score >= 60) return 'Limited wardrobe detected'
  return 'Low confidence'
}

function reasoningFor(items: WardrobeEngineItem[], request: OutfitRequest, breakdown: OutfitScoreBreakdown) {
  const occasionResult = scoreOccasionSuitability(items, request.occasion || 'casual')
  const balance = analyzeOutfitBalance(items)
  const weather = analyzeWeather({ condition: request.weather, temperature: request.temperature, season: request.season })
  const reasons: string[] = []

  if (breakdown.weatherScore >= 78) reasons.push(`Strong ${weather.condition} weather match.`)
  else if (breakdown.weatherScore < 55) reasons.push(`Weather match needs caution for ${weather.condition} conditions.`)
  if (breakdown.personalization > 0) reasons.push("Matches user's learned color, style, or category preferences.")
  if (occasionResult.score >= 75) reasons.push(`Suitable for ${occasionResult.occasion} styling.`)
  else reasons.push(`Only a partial ${occasionResult.occasion} match.`)
  if (balance.score >= 75) reasons.push('Balanced silhouette, layers, colors, and formality.')
  if (balance.conflicts.length) reasons.push(`Avoided because ${balance.conflicts[0]}.`)
  if (breakdown.diversityScore >= 75) reasons.push('Adds variety against recent outfit structures.')
  return reasons.slice(0, 5)
}

export function scoreOutfit(items: WardrobeEngineItem[], request: OutfitRequest = {}) {
  const cacheKey = JSON.stringify({
    key: outfitKey(items),
    occasion: request.occasion,
    weather: request.weather,
    temperature: request.temperature,
    season: request.season,
    rain: request.rain,
    windKph: request.windKph,
    humidity: request.humidity,
    uvIndex: request.uvIndex,
    timeOfDay: request.timeOfDay,
    boldFashion: request.boldFashion,
    previousOutfitKeys: request.previousOutfitKeys,
    recentlyGenerated: request.recentlyGenerated,
    usage: items.map((item) => [itemKey(item), request.itemUsageCount?.[itemKey(item)], item.lastWornAt])
  })
  const cached = scoreCache.get(cacheKey)
  if (cached) return cached

  const colors = items.flatMap(itemColors)
  const currentOutfitKey = outfitKey(items)
  const memoryPenalty = (request.previousOutfitKeys || []).includes(currentOutfitKey) ? 18 : 0
  const occasion = String(request.occasion || '').toLowerCase()
  const season = request.season || (['winter', 'summer'].includes(occasion) ? occasion : undefined)
  const validation = validateOutfitWeather(items, { condition: request.weather, temperature: request.temperature, season })
  const balance = analyzeOutfitBalance(items)
  const occasionFit = scoreOccasionSuitability(items, request.occasion || 'casual')
  const weatherScore = validation.valid ? scoreWeatherFit(items, { condition: request.weather, temperature: request.temperature, season }) : 0
  const breakdown: OutfitScoreBreakdown = {
    colorScore: colors.length ? Math.round((getPaletteCompatibilityScore(colors) + balance.colorBalance) / 2) : balance.colorBalance,
    styleScore: styleScore(items, request),
    seasonScore: seasonScore(items, request),
    occasionScore: occasionFit.score,
    balanceScore: balance.score,
    personalization: preferenceBoost(items, request.preferences || emptyPreferenceProfile, request.occasion),
    weatherScore,
    diversityScore: diversityScore(items, request),
    memoryPenalty: memoryPenalty + recentlyWornPenalty(items),
    weatherPenalty: validation.valid ? weatherPenalty(items, { condition: request.weather, temperature: request.temperature, season }) : 1000,
    fashionScore: Math.round((occasionFit.score + balance.score + weatherScore) / 3),
    itemPreferenceScore: learnedItemScore(items, request)
  }
  const stylist = scoreStylistOutfit(items, {
    occasion: String(request.occasion || 'casual'),
    weather: {
      condition: request.weather,
      temperature: request.temperature,
      rain: request.rain,
      windKph: request.windKph,
      humidity: request.humidity,
      uvIndex: request.uvIndex,
      timeOfDay: request.timeOfDay
    },
    season,
    usage: request.itemUsageCount,
    recentlySuggested: request.recentlyGenerated,
    boldColor: request.boldFashion
  })
  const aiBreakdown: StylistScoreBreakdown = stylist.breakdown
  breakdown.colorScore = Math.round((breakdown.colorScore + aiBreakdown.colorHarmony) / 2)
  breakdown.occasionScore = Math.round((breakdown.occasionScore + aiBreakdown.occasionCompatibility) / 2)
  breakdown.weatherScore = Math.round((breakdown.weatherScore + aiBreakdown.weatherCompatibility) / 2)
  breakdown.seasonScore = Math.round((breakdown.seasonScore + aiBreakdown.seasonCompatibility) / 2)
  breakdown.balanceScore = Math.round((breakdown.balanceScore + aiBreakdown.layeringQuality) / 2)
  breakdown.diversityScore = Math.round((breakdown.diversityScore + aiBreakdown.clothingDiversity) / 2)
  breakdown.memoryPenalty += Math.round(aiBreakdown.recentlyWornPenalty / 5)
  breakdown.aiColorHarmony = aiBreakdown.colorHarmony
  breakdown.aiOccasionCompatibility = aiBreakdown.occasionCompatibility
  breakdown.aiWeatherCompatibility = aiBreakdown.weatherCompatibility
  breakdown.aiLayeringQuality = aiBreakdown.layeringQuality
  breakdown.aiStyleConsistency = aiBreakdown.styleConsistency
  breakdown.aiRecentlyWornPenalty = aiBreakdown.recentlyWornPenalty

  const preferenceScore = Math.max(0, Math.min(100, 50 + (breakdown.personalization + breakdown.itemPreferenceScore) * 2))
  const weighted =
    breakdown.colorScore * 0.14 +
    breakdown.styleScore * 0.13 +
    breakdown.weatherScore * 0.17 +
    breakdown.seasonScore * 0.07 +
    preferenceScore * 0.13 +
    breakdown.diversityScore * 0.05 +
    breakdown.occasionScore * 0.17 +
    breakdown.balanceScore * 0.15 -
    breakdown.memoryPenalty -
    breakdown.weatherPenalty -
    (balance.valid ? 0 : 22)

  const legacyScore = validation.valid && balance.valid ? Math.max(0, Math.min(100, Math.round(weighted))) : Math.max(0, Math.min(40, Math.round(weighted)))
  const score = Math.max(0, Math.min(100, Math.round(legacyScore * 0.52 + stylist.score * 0.48)))
  const result = {
    score: stylist.layering.impossible ? Math.min(35, score) : score,
    breakdown,
    confidence: confidenceScore(items, breakdown),
    confidenceLabel: confidenceLabel(confidenceScore(items, breakdown)),
    reasoning: reasoningFor(items, request, breakdown),
    weatherMatch: stylist.weather,
    colorMatch: stylist.color,
    layering: stylist.layering
  }
  if (scoreCache.size > 600) scoreCache.clear()
  scoreCache.set(cacheKey, result)
  return result
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
  const reasoning = reasoningFor(items, request, breakdown)
  const stylist = scoreStylistOutfit(items, {
    occasion,
    weather: { condition: request.weather, temperature: request.temperature, rain: request.rain, windKph: request.windKph, humidity: request.humidity, uvIndex: request.uvIndex, timeOfDay: request.timeOfDay },
    season: request.season,
    usage: request.itemUsageCount,
    recentlySuggested: request.recentlyGenerated,
    boldColor: request.boldFashion
  })
  return explainOutfitLocally({ items, occasion, score, breakdown }, { condition: request.weather, temperature: request.temperature, season: request.season })
    || explainStylistChoice({
      occasion,
      color: stylist.color,
      weather: stylist.weather,
      score,
      layerScore: stylist.layering.score,
      diversityScore: stylist.breakdown.clothingDiversity
    })
    || `This ${occasion} outfit works because the ${palette} keeps the pieces cohesive, while ${categories} create a balanced silhouette. ${reasoning.slice(0, 2).join(' ')}`
}

function topCandidates(items: WardrobeEngineItem[], categories: string[], limit: number) {
  return items
    .filter((item) => categories.includes(normalizeCategory(item.category)) || categories.includes(itemKnowledgeKey(item)))
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
  console.info('[Noir Closet outfit weather rejection]', {
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
  const occasion = normalizeOccasion(request.occasion || 'casual')
  const pools = occasionCategoryPools(occasion)
  const preferred = new Set(pools.preferred)
  const tops = sampleTop(topCandidates(items, ['tshirt', 'shirt', 'hoodie', 'polo', 'dress-shirt', 'oversized-tshirt', 'linen-shirt'].filter((category) => !preferred.size || preferred.has(category) || ['tshirt', 'shirt', 'hoodie'].includes(category)), 22), 12)
  const layers = sampleTop(topCandidates(items, ['jacket', 'blazer'], 10), 5)
  const bottoms = sampleTop(topCandidates(items, ['jeans', 'cargo', 'shorts', 'chinos', 'trousers', 'gym-shorts'], 22), 12)
  const shoes = sampleTop(topCandidates(items, ['sneakers', 'boots', 'loafers', 'oxford-shoes', 'heels', 'sandals', 'slides'], 16), 8)
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
  const missingEssentials = detectMissingEssentials(items)

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
    .filter((combo) => analyzeOutfitBalance(combo).valid)
    .filter((combo) => !scoreStylistOutfit(combo, {
      occasion,
      weather: { condition: request.weather, temperature: request.temperature, rain: request.rain, windKph: request.windKph, humidity: request.humidity, uvIndex: request.uvIndex, timeOfDay: request.timeOfDay },
      season: request.season,
      usage: request.itemUsageCount,
      recentlySuggested: request.recentlyGenerated,
      boldColor: request.boldFashion
    }).layering.impossible)
    .map((combo, index) => {
      const { score, breakdown, confidence, confidenceLabel, reasoning, weatherMatch } = scoreOutfit(combo, request)
      const colors = [...new Set(combo.flatMap(itemColors))]
      const validation = validateOutfitWeather(combo, weatherContextForRequest(request, occasion))
      const tags = [...new Set([occasion, validation.weather, `${outfitLayerCount(combo)} layers`, `warmth ${outfitWarmthScore(combo)}`, ...combo.map((item) => normalizeStyle(item.style)), ...combo.flatMap((item) => item.tags || [])])].slice(0, 8)
      const combinationConfidence = scoreOutfitConfidence(combo, items, candidates.length, score)
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
        confidence: Math.round((confidence + combinationConfidence.score) / 2),
        confidenceLabel: combinationConfidence.label || confidenceLabel,
        weatherMatch: weatherMatch ? {
          score: weatherMatch.score,
          label: weatherMatch.label,
          condition: weatherMatch.condition,
          reasons: weatherMatch.reasons,
          prefer: weatherMatch.prefer,
          avoid: weatherMatch.avoid
        } : undefined,
        missingEssentials,
        reasoning
      }
    })
    .sort((a, b) => (b.score + Math.random() * Math.max(1, b.breakdown.diversityScore / 12)) - (a.score + Math.random() * Math.max(1, a.breakdown.diversityScore / 12)))

  const unique: GeneratedOutfit[] = []
  const structures = new Map<string, number>()
  const colorSignatures = new Map<string, number>()
  const usedItems = new Set<string>()
  const recentStructures = new Set(request.recentStructures || [])
  const recentColors = new Set(request.recentColorSignatures || [])
  const maxResults = request.limit || 5

  for (const outfit of scored) {
    const structure = outfitStructureKey(outfit.items)
    const colorSignature = outfitColorSignature(outfit.items)
    const repeatedItems = outfit.items.filter((item) => usedItems.has(itemKey(item))).length
    if (recentStructures.has(structure) && unique.length >= Math.max(1, Math.floor(maxResults / 2))) continue
    if (recentColors.has(colorSignature) && unique.length >= Math.max(1, Math.floor(maxResults / 2))) continue
    if ((structures.get(structure) || 0) >= 1 && repeatedItems >= Math.max(1, outfit.items.length - 1)) continue
    if ((structures.get(structure) || 0) >= 2) continue
    if ((colorSignatures.get(colorSignature) || 0) >= 2) continue
    unique.push(outfit)
    structures.set(structure, (structures.get(structure) || 0) + 1)
    colorSignatures.set(colorSignature, (colorSignatures.get(colorSignature) || 0) + 1)
    outfit.items.forEach((item) => usedItems.add(itemKey(item)))
    if (unique.length >= maxResults) break
  }

  return unique.length ? unique : scored.slice(0, maxResults)
}
