import type { ClothingCategory } from './fashion-analysis'

export type WeatherContext = {
  temperature?: number
  condition?: string
  season?: string
}

export type WeatherRecommendation = {
  targetWarmth: number
  needsLayer: boolean
  avoidHeavyLayers: boolean
  suggestedCategories: ClothingCategory[]
  tip: string
}

function normalizedCondition(condition?: string) {
  return String(condition || '').toLowerCase()
}

export function analyzeWeather(input: WeatherContext = {}): WeatherRecommendation {
  const condition = normalizedCondition(input.condition)
  const temp = typeof input.temperature === 'number' ? input.temperature : undefined
  const cold = condition.includes('cold') || condition.includes('winter') || (temp !== undefined && temp <= 14)
  const hot = condition.includes('hot') || condition.includes('sun') || condition.includes('summer') || (temp !== undefined && temp >= 27)
  const rain = condition.includes('rain') || condition.includes('storm') || condition.includes('drizzle')

  if (cold) {
    return {
      targetWarmth: 78,
      needsLayer: true,
      avoidHeavyLayers: false,
      suggestedCategories: ['hoodie', 'jacket', 'boots'],
      tip: rain ? 'Cold and wet conditions favor a structured outer layer and sturdy footwear.' : 'Cold weather raises the score for hoodies, jackets, and warmer footwear.'
    }
  }

  if (hot) {
    return {
      targetWarmth: 28,
      needsLayer: false,
      avoidHeavyLayers: true,
      suggestedCategories: ['tshirt', 'shirt', 'shorts', 'sneakers'],
      tip: 'Hot weather favors breathable tops, lighter colors, and fewer layers.'
    }
  }

  return {
    targetWarmth: rain ? 58 : 48,
    needsLayer: rain,
    avoidHeavyLayers: false,
    suggestedCategories: rain ? ['jacket', 'sneakers', 'boots'] : ['tshirt', 'shirt', 'jeans', 'sneakers'],
    tip: rain ? 'Rainy conditions benefit from an outer layer without overbuilding the outfit.' : 'Mild weather gives the engine more room to prioritize color and style.'
  }
}

export function scoreWeatherFit(items: Array<{ category?: string; warmthScore?: number }>, weather: WeatherContext = {}) {
  const recommendation = analyzeWeather(weather)
  const warmth = items.reduce((sum, item) => sum + Number(item.warmthScore || 45), 0) / Math.max(1, items.length)
  const delta = Math.abs(warmth - recommendation.targetWarmth)
  let score = Math.max(0, 100 - delta)
  const categories = items.map((item) => String(item.category || '').toLowerCase())
  if (recommendation.needsLayer && categories.some((category) => ['hoodie', 'jacket'].includes(category))) score += 10
  if (recommendation.avoidHeavyLayers && categories.some((category) => ['hoodie', 'jacket', 'boots'].includes(category))) score -= 18
  return Math.max(0, Math.min(100, Math.round(score)))
}

