import type { ClothingCategory } from './fashion-analysis'

export type WeatherBand = 'hot' | 'warm' | 'cool' | 'cold' | 'mild'
export type WeatherSignal = WeatherBand | 'rainy' | 'humid' | 'windy'

export type WeatherContext = {
  temperature?: number
  condition?: 'hot' | 'warm' | 'cool' | 'cold' | 'rainy' | 'humid' | 'windy' | string
  season?: string
}

export type WeatherRecommendation = {
  condition: WeatherSignal
  thermalBand: WeatherBand
  signals: WeatherSignal[]
  targetWarmth: number
  warmthRange: [number, number]
  maxLayers: number
  needsLayer: boolean
  avoidHeavyLayers: boolean
  suggestedCategories: string[]
  avoidCategories: string[]
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
  weather: WeatherSignal
  thermalBand: WeatherBand
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

const HOT_DISALLOWED = ['jacket', 'coat', 'puffer', 'parka', 'thermal', 'heavy hoodie', 'hoodie', 'sweatshirt', 'sweater']
const HUMID_DISALLOWED = ['hoodie', 'sweatshirt', 'sweater', 'fleece', 'wool', 'jacket', 'coat', 'puffer', 'parka']
const RAIN_PREFERRED = ['jacket', 'boots', 'sneakers']
const WIND_PREFERRED = ['jacket', 'hoodie', 'shirt', 'jeans']
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
  const cool = condition.includes('cool') || condition.includes('wind') || (temp !== undefined && temp > 14 && temp <= 20)
  const warm = condition.includes('warm') || condition.includes('humid') || (temp !== undefined && temp > 20 && temp < 30)
  const hot = condition.includes('hot') || condition.includes('sun') || condition.includes('summer') || season === 'summer' || (temp !== undefined && temp >= 30)

  if (cold) return 'cold'
  if (hot) return 'hot'
  if (cool) return 'cool'
  if (warm) return 'warm'
  return 'mild'
}

function weatherSignals(input: WeatherContext = {}) {
  const condition = normalizedCondition(input.condition)
  const band = weatherBand(input) as WeatherBand
  const signals = new Set<WeatherSignal>([band])
  if (condition.includes('rain') || condition.includes('storm') || condition.includes('drizzle')) signals.add('rainy')
  if (condition.includes('humid') || condition.includes('muggy')) signals.add('humid')
  if (condition.includes('wind') || condition.includes('breezy')) signals.add('windy')
  return [...signals]
}

export function analyzeWeather(input: WeatherContext = {}): WeatherRecommendation {
  const signals = weatherSignals(input)
  const band = weatherBand(input) as WeatherBand
  const cold = band === 'cold'
  const cool = band === 'cool'
  const warm = band === 'warm'
  const hot = band === 'hot'
  const rain = signals.includes('rainy')
  const humid = signals.includes('humid')
  const windy = signals.includes('windy')
  const displayCondition = rain ? 'rainy' : humid ? 'humid' : windy ? 'windy' : band

  if (cold) {
    return {
      condition: displayCondition,
      thermalBand: 'cold',
      signals,
      targetWarmth: 13,
      warmthRange: [9, 18],
      maxLayers: windy || rain ? 4 : 3,
      needsLayer: true,
      avoidHeavyLayers: false,
      suggestedCategories: ['hoodie', 'jacket', 'boots'],
      avoidCategories: ['shorts', 'slides', 'sandals'],
      tip: rain ? 'Cold and wet conditions favor a structured outer layer and sturdy footwear.' : 'Cold weather raises the score for hoodies, jackets, and warmer footwear.'
    }
  }

  if (hot) {
    return {
      condition: displayCondition,
      thermalBand: 'hot',
      signals,
      targetWarmth: 4,
      warmthRange: humid ? [1, 6] : [1, 7],
      maxLayers: 1,
      needsLayer: false,
      avoidHeavyLayers: true,
      suggestedCategories: ['tshirt', 'linen-shirt', 'shirt', 'shorts', 'sneakers', 'sandals'],
      avoidCategories: HOT_DISALLOWED,
      tip: 'Hot weather favors breathable tops, linen or light shirts, shorts, and minimal layering.'
    }
  }

  if (cool || warm) {
    return {
      condition: displayCondition,
      thermalBand: cool ? 'cool' : 'warm',
      signals,
      targetWarmth: cool ? 9 : humid ? 5 : 6,
      warmthRange: cool ? [6, 13] : humid ? [2, 8] : [3, 9],
      maxLayers: cool ? 3 : 2,
      needsLayer: cool || rain || windy,
      avoidHeavyLayers: warm || humid,
      suggestedCategories: cool
        ? ['shirt', ...(rain || windy ? ['jacket'] : ['hoodie']), 'jeans', 'sneakers']
        : ['tshirt', 'linen-shirt', 'shirt', 'jeans', 'shorts', 'sneakers'],
      avoidCategories: humid ? HUMID_DISALLOWED : warm ? ['coat', 'puffer', 'parka', 'thermal'] : [],
      tip: cool ? 'Cool weather benefits from one flexible layer without going full winter.' : 'Warm or humid weather favors breathable pieces and restrained layering.'
    }
  }

  return {
    condition: displayCondition,
    thermalBand: 'mild',
    signals,
    targetWarmth: rain ? 8 : 7,
    warmthRange: rain ? [5, 11] : [4, 10],
    maxLayers: rain ? 3 : 2,
    needsLayer: rain || windy,
    avoidHeavyLayers: false,
    suggestedCategories: rain ? RAIN_PREFERRED : windy ? WIND_PREFERRED : ['tshirt', 'shirt', 'jeans', 'sneakers'],
    avoidCategories: rain ? ['slides', 'sandals'] : [],
    tip: rain ? 'Rainy conditions benefit from an outer layer and covered footwear without overbuilding the outfit.' : 'Mild weather gives the engine more room to prioritize occasion, color, and style.'
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

  if (recommendation.thermalBand === 'hot') {
    penalty += categories.filter((category) => HOT_DISALLOWED.includes(category)).length * 100
    if (outfitLayerCount(items) > recommendation.maxLayers) penalty += 100
  }
  if (recommendation.signals.includes('humid')) {
    penalty += categories.filter((category) => HUMID_DISALLOWED.includes(category)).length * 45
  }
  if (recommendation.signals.includes('rainy')) {
    penalty += categories.filter((category) => ['slides', 'sandals'].includes(category)).length * 40
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

  if (recommendation.thermalBand === 'hot') {
    const disallowed = categories.find((category) => HOT_DISALLOWED.includes(category) || category === 'hoodie')
    if (disallowed) reason = `${disallowed} is too warm for hot weather`
  }
  if (!reason && recommendation.signals.includes('humid') && categories.some((category) => HUMID_DISALLOWED.includes(category))) reason = 'heavy fabric conflicts with humid weather'
  if (!reason && recommendation.signals.includes('rainy') && categories.some((category) => ['slides', 'sandals'].includes(category))) reason = 'open footwear conflicts with rainy weather'
  if (!reason && layerCount > recommendation.maxLayers) reason = `layer count ${layerCount} exceeds ${recommendation.maxLayers} for ${recommendation.condition} weather`
  if (!reason && warmthScore > maxWarmth) reason = `warmth score ${warmthScore} exceeds ${maxWarmth} for ${recommendation.condition} weather`
  if (!reason && warmthScore < minWarmth && recommendation.thermalBand === 'cold') reason = `warmth score ${warmthScore} is below ${minWarmth} for cold weather`
  if (!reason && season === 'summer' && categories.some((category) => SUMMER_PENALIZED.includes(category))) reason = 'heavy winter category conflicts with summer'
  if (!reason && season === 'summer' && itemSeasons.some((itemSeason) => itemSeason === 'winter')) reason = 'winter item conflicts with summer'
  if (!reason && season === 'winter' && categories.includes('shorts')) reason = 'shorts conflict with winter'

  return {
    valid: !reason,
    reason: reason || undefined,
    weather: recommendation.condition,
    thermalBand: recommendation.thermalBand,
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
  if (recommendation.signals.includes('humid') && categories.some((category) => ['tshirt', 'shirt', 'shorts', 'sandals'].includes(category))) score += 8
  if (recommendation.signals.includes('rainy') && categories.some((category) => ['jacket', 'boots'].includes(category))) score += 8
  if (recommendation.signals.includes('windy') && categories.some((category) => ['jacket', 'hoodie'].includes(category))) score += 6
  score -= weatherPenalty(items, weather)
  return Math.max(0, Math.min(100, Math.round(score)))
}
