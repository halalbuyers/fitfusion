import type { ClothingCategory } from './fashion-analysis'

export type WeatherContext = {
  temperature?: number
  condition?: 'hot' | 'warm' | 'cool' | 'cold' | 'rainy' | string
  season?: string
}

export type WeatherRecommendation = {
  condition: 'hot' | 'warm' | 'cool' | 'cold' | 'mild'
  targetWarmth: number
  warmthRange: [number, number]
  maxLayers: number
  needsLayer: boolean
  avoidHeavyLayers: boolean
  suggestedCategories: ClothingCategory[]
  tip: string
}

type WeatherAwareItem = {
  category?: string
  warmthScore?: number
  season?: string
  material?: string
  tags?: string[]
  style?: string
  fit?: string
  fitType?: string
}

export type OutfitWeatherValidation = {
  valid: boolean
  reason?: string
  weather: 'hot' | 'warm' | 'cool' | 'cold' | 'mild'
  season: string
  layerCount: number
  warmthScore: number
}

const CATEGORY_WARMTH: Record<string, number> = {
  tshirt: 1,
  tee: 1,
  't-shirt': 1,
  polo: 1,
  shirt: 2,
  shorts: 1,
  sandals: 1,
  sneakers: 1,
  jeans: 2,
  chinos: 2,
  cargo: 2,
  boots: 3,
  hoodie: 4,
  sweatshirt: 4,
  sweater: 4,
  thermal: 5,
  jacket: 5,
  blazer: 4,
  coat: 7,
  parka: 7,
  puffer: 7
}

const HOT_DISALLOWED = ['jacket', 'coat', 'puffer', 'parka', 'thermal', 'heavy hoodie']
const SUMMER_PREFERRED = ['tshirt', 'tee', 't-shirt', 'polo', 'shorts', 'shirt', 'lightweight', 'linen', 'sneakers', 'sandals']
const SUMMER_PENALIZED = ['hoodie', 'jacket', 'coat', 'puffer', 'parka', 'thermal', 'fleece', 'wool']

function normalizedCondition(condition?: string) {
  return String(condition || '').toLowerCase()
}

export function weatherBand(input: WeatherContext = {}): OutfitWeatherValidation['weather'] {
  const condition = normalizedCondition(input.condition)
  const season = normalizedCondition(input.season)
  const temp = typeof input.temperature === 'number' ? input.temperature : undefined
  const cold = condition.includes('cold') || condition.includes('winter') || season === 'winter' || (temp !== undefined && temp <= 14)
  const cool = condition.includes('cool') || (temp !== undefined && temp > 14 && temp <= 20)
  const warm = condition.includes('warm') || (temp !== undefined && temp > 20 && temp < 27)
  const hot = condition.includes('hot') || condition.includes('sun') || condition.includes('summer') || season === 'summer' || (temp !== undefined && temp >= 27)

  if (cold) return 'cold'
  if (hot) return 'hot'
  if (cool) return 'cool'
  if (warm) return 'warm'
  return 'mild'
}

export function analyzeWeather(input: WeatherContext = {}): WeatherRecommendation {
  const condition = normalizedCondition(input.condition)
  const band = weatherBand(input)
  const cold = band === 'cold'
  const cool = band === 'cool'
  const warm = band === 'warm'
  const hot = band === 'hot'
  const rain = condition.includes('rain') || condition.includes('storm') || condition.includes('drizzle')

  if (cold) {
    return {
      condition: 'cold',
      targetWarmth: 13,
      warmthRange: [9, 18],
      maxLayers: 4,
      needsLayer: true,
      avoidHeavyLayers: false,
      suggestedCategories: ['hoodie', 'jacket', 'boots'],
      tip: rain ? 'Cold and wet conditions favor a structured outer layer and sturdy footwear.' : 'Cold weather raises the score for hoodies, jackets, and warmer footwear.'
    }
  }

  if (hot) {
    return {
      condition: 'hot',
      targetWarmth: 4,
      warmthRange: [1, 7],
      maxLayers: 1,
      needsLayer: false,
      avoidHeavyLayers: true,
      suggestedCategories: ['tshirt', 'shirt', 'shorts', 'sneakers'],
      tip: 'Hot weather favors breathable tops, lighter colors, and fewer layers.'
    }
  }

  if (cool || warm) {
    return {
      condition: cool ? 'cool' : 'warm',
      targetWarmth: cool ? 9 : 6,
      warmthRange: cool ? [6, 13] : [3, 9],
      maxLayers: cool ? 3 : 2,
      needsLayer: cool || rain,
      avoidHeavyLayers: warm,
      suggestedCategories: cool ? ['shirt', 'hoodie', 'jacket', 'jeans', 'sneakers'] : ['tshirt', 'shirt', 'jeans', 'shorts', 'sneakers'],
      tip: cool ? 'Cool weather benefits from one flexible layer without going full winter.' : 'Warm weather favors breathable pieces and restrained layering.'
    }
  }

  return {
    condition: 'mild',
    targetWarmth: rain ? 8 : 7,
    warmthRange: rain ? [5, 11] : [4, 10],
    maxLayers: rain ? 3 : 2,
    needsLayer: rain,
    avoidHeavyLayers: false,
    suggestedCategories: rain ? ['jacket', 'sneakers', 'boots'] : ['tshirt', 'shirt', 'jeans', 'sneakers'],
    tip: rain ? 'Rainy conditions benefit from an outer layer without overbuilding the outfit.' : 'Mild weather gives the engine more room to prioritize color and style.'
  }
}

function itemText(item: WeatherAwareItem) {
  return [
    item.category,
    item.style,
    item.fit,
    item.fitType,
    item.material,
    ...(item.tags || [])
  ].filter(Boolean).join(' ').toLowerCase()
}

function normalizedItemCategory(item: WeatherAwareItem) {
  const text = itemText(item)
  if (text.includes('puffer')) return 'puffer'
  if (text.includes('parka')) return 'parka'
  if (text.includes('coat')) return 'coat'
  if (text.includes('thermal')) return 'thermal'
  if (text.includes('sweater')) return 'sweater'
  if (text.includes('polo')) return 'polo'
  if (text.includes('sandal')) return 'sandals'
  if (text.includes('chino')) return 'chinos'
  return String(item.category || '').toLowerCase()
}

export function itemWarmthValue(item: WeatherAwareItem) {
  const category = normalizedItemCategory(item)
  const text = itemText(item)
  let warmth = CATEGORY_WARMTH[category] ?? CATEGORY_WARMTH[String(item.category || '').toLowerCase()] ?? 2

  if (!CATEGORY_WARMTH[category] && typeof item.warmthScore === 'number') {
    warmth = Math.max(warmth, Math.round(item.warmthScore / 12))
  }
  if (text.includes('light') || text.includes('linen')) warmth -= 1
  if (text.includes('heavy') || text.includes('wool') || text.includes('fleece')) warmth += 1

  return Math.max(1, Math.min(8, warmth))
}

export function outfitWarmthScore(items: WeatherAwareItem[]) {
  return items.reduce((sum, item) => sum + itemWarmthValue(item), 0)
}

export function outfitLayerCount(items: WeatherAwareItem[]) {
  return items.filter((item) => {
    const category = normalizedItemCategory(item)
    return ['tshirt', 'tee', 't-shirt', 'polo', 'shirt', 'hoodie', 'sweatshirt', 'sweater', 'thermal', 'jacket', 'blazer', 'coat', 'parka', 'puffer'].includes(category)
  }).length
}

export function weatherPenalty(items: WeatherAwareItem[], weather: WeatherContext = {}) {
  const recommendation = analyzeWeather(weather)
  const categories = items.map(normalizedItemCategory)
  const season = normalizedCondition(weather.season)
  let penalty = 0

  if (recommendation.condition === 'hot') {
    penalty += categories.filter((category) => HOT_DISALLOWED.includes(category)).length * 100
    if (categories.includes('hoodie')) penalty += itemText(items[categories.indexOf('hoodie')]).includes('heavy') ? 100 : 60
    if (outfitLayerCount(items) > recommendation.maxLayers) penalty += 100
  }

  if (season === 'summer') {
    penalty += categories.filter((category) => SUMMER_PREFERRED.includes(category)).length * -6
    penalty += categories.filter((category) => SUMMER_PENALIZED.includes(category)).length * 55
  }

  if ((recommendation.condition === 'cold' || season === 'winter') && categories.includes('shorts')) penalty += 80

  return penalty
}

export function validateOutfitWeather(items: WeatherAwareItem[], weather: WeatherContext = {}): OutfitWeatherValidation {
  const recommendation = analyzeWeather(weather)
  const season = normalizedCondition(weather.season) || 'all-season'
  const categories = items.map(normalizedItemCategory)
  const layerCount = outfitLayerCount(items)
  const warmthScore = outfitWarmthScore(items)
  const [minWarmth, maxWarmth] = recommendation.warmthRange
  const itemSeasons = items.map((item) => normalizedCondition(item.season)).filter(Boolean)
  let reason = ''

  if (recommendation.condition === 'hot') {
    const disallowed = categories.find((category) => HOT_DISALLOWED.includes(category) || category === 'hoodie')
    if (disallowed) reason = `${disallowed} is too warm for hot weather`
  }
  if (!reason && layerCount > recommendation.maxLayers) reason = `layer count ${layerCount} exceeds ${recommendation.maxLayers} for ${recommendation.condition} weather`
  if (!reason && warmthScore > maxWarmth) reason = `warmth score ${warmthScore} exceeds ${maxWarmth} for ${recommendation.condition} weather`
  if (!reason && warmthScore < minWarmth && recommendation.condition === 'cold') reason = `warmth score ${warmthScore} is below ${minWarmth} for cold weather`
  if (!reason && season === 'summer' && categories.some((category) => SUMMER_PENALIZED.includes(category))) reason = 'heavy winter category conflicts with summer'
  if (!reason && season === 'summer' && itemSeasons.some((itemSeason) => itemSeason === 'winter')) reason = 'winter item conflicts with summer'
  if (!reason && season === 'winter' && categories.includes('shorts')) reason = 'shorts conflict with winter'

  return {
    valid: !reason,
    reason: reason || undefined,
    weather: recommendation.condition,
    season,
    layerCount,
    warmthScore
  }
}

export function scoreWeatherFit(items: WeatherAwareItem[], weather: WeatherContext = {}) {
  const recommendation = analyzeWeather(weather)
  const warmth = outfitWarmthScore(items)
  const delta = Math.abs(warmth - recommendation.targetWarmth)
  let score = Math.max(0, 100 - delta * 10)
  const categories = items.map(normalizedItemCategory)
  if (recommendation.needsLayer && categories.some((category) => ['hoodie', 'jacket'].includes(category))) score += 10
  if (recommendation.avoidHeavyLayers && categories.some((category) => ['hoodie', 'jacket', 'coat', 'puffer', 'boots'].includes(category))) score -= 45
  score -= weatherPenalty(items, weather)
  return Math.max(0, Math.min(100, Math.round(score)))
}
