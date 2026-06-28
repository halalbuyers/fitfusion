import { analyzeWeather, scoreWeatherFit, validateOutfitWeather, type WeatherContext } from '../weather-engine'

export type AdvancedWeatherContext = WeatherContext & {
  rain?: boolean | number
  windKph?: number
  humidity?: number
  uvIndex?: number
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | string
}

export type WeatherMatchResult = {
  score: number
  label: string
  condition: string
  valid: boolean
  reasons: string[]
  avoid: string[]
  prefer: string[]
}

function conditionWithSignals(input: AdvancedWeatherContext = {}) {
  const terms = [input.condition]
  if (input.rain === true || Number(input.rain || 0) > 0) terms.push('rainy')
  if (Number(input.windKph || 0) >= 24) terms.push('windy')
  if (Number(input.humidity || 0) >= 70) terms.push('humid')
  if (Number(input.uvIndex || 0) >= 7) terms.push('sun')
  return terms.filter(Boolean).join(' ')
}

export function normalizeWeatherContext(input: AdvancedWeatherContext = {}): AdvancedWeatherContext {
  return { ...input, condition: conditionWithSignals(input) || input.condition }
}

export function analyzeWeatherMatch(items: Parameters<typeof scoreWeatherFit>[0], input: AdvancedWeatherContext = {}): WeatherMatchResult {
  const weather = normalizeWeatherContext(input)
  const recommendation = analyzeWeather(weather)
  const validation = validateOutfitWeather(items, weather)
  let score = validation.valid ? scoreWeatherFit(items, weather) : Math.min(45, scoreWeatherFit(items, weather))
  const reasons = [recommendation.tip]

  if (Number(input.uvIndex || 0) >= 7) {
    score -= items.some((item) => String(item.category || '').toLowerCase().includes('jacket')) ? 8 : 0
    reasons.push('High UV favors breathable pieces and lighter coverage.')
  }
  if (String(input.timeOfDay || '').toLowerCase() === 'night' && recommendation.thermalBand !== 'hot') {
    score = Math.min(100, score + 4)
    reasons.push('Night conditions allow a slightly warmer outfit.')
  }
  if (!validation.valid && validation.reason) reasons.push(validation.reason)

  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  return {
    score: clamped,
    label: clamped >= 85 ? 'Excellent weather match' : clamped >= 70 ? 'Good weather match' : clamped >= 55 ? 'Usable weather match' : 'Weak weather match',
    condition: recommendation.condition,
    valid: validation.valid,
    reasons,
    avoid: recommendation.avoidCategories,
    prefer: recommendation.suggestedCategories
  }
}

