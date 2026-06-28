import { analyzeOutfitBalance } from '../balance-engine'
import { normalizeStyle } from '../fashion-analysis'
import { analyzeColorCompatibility } from './colorEngine'
import { scoreOccasionMatch } from './occasionEngine'
import { scoreRotation } from './rotationEngine'
import { analyzeWeatherMatch, type AdvancedWeatherContext } from './weatherEngine'

export type StylistScoringItem = {
  _id?: string
  id?: string
  image?: string
  category?: string
  primaryColor?: string
  secondaryColors?: string[]
  color?: string
  colors?: string[]
  style?: string
  season?: string
  material?: string
  tags?: string[]
  formalityScore?: number
  warmthScore?: number
  wearCount?: number
  usageCount?: number
  lastWornAt?: Date | string | null
}

export type StylistScoreBreakdown = {
  colorHarmony: number
  occasionCompatibility: number
  weatherCompatibility: number
  seasonCompatibility: number
  layeringQuality: number
  styleConsistency: number
  clothingDiversity: number
  recentlyWornPenalty: number
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function itemColors(item: StylistScoringItem) {
  return [item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])].filter(Boolean) as string[]
}

function seasonCompatibility(items: StylistScoringItem[], season?: string) {
  const requested = String(season || 'all-season').toLowerCase()
  if (!requested || requested === 'all-season') return 82
  const matches = items.filter((item) => ['all-season', requested].includes(String(item.season || 'all-season').toLowerCase())).length
  return clamp((matches / Math.max(1, items.length)) * 100)
}

function styleConsistency(items: StylistScoringItem[]) {
  const styles = [...new Set(items.map((item) => normalizeStyle(item.style)).filter(Boolean))]
  if (styles.length <= 1) return 92
  if (styles.length === 2) return 78
  return 58
}

export function analyzeLayeringQuality(items: StylistScoringItem[]) {
  const text = items.map((item) => [item.category, item.style, item.material, ...(item.tags || [])].join(' ').toLowerCase())
  const has = (term: string) => text.some((value) => value.includes(term))
  const topLayers = ['hoodie', 'sweater', 'sweatshirt', 'jacket', 'blazer', 'coat', 'puffer'].filter(has)
  const impossible = has('hoodie') && has('sweater') && has('jacket') || topLayers.length >= 4
  let score = 76
  if (topLayers.length === 1) score += 12
  if (topLayers.length === 2) score += 4
  if (topLayers.length > 2) score -= topLayers.length * 16
  if (impossible) score = 12
  return { score: clamp(score), impossible, layers: topLayers }
}

export function scoreStylistOutfit(items: StylistScoringItem[], options: {
  occasion?: string
  weather?: AdvancedWeatherContext
  season?: string
  usage?: Record<string, number>
  recentlySuggested?: string[]
  boldColor?: boolean
}) {
  const color = analyzeColorCompatibility(items.flatMap(itemColors), { bold: options.boldColor })
  const occasion = scoreOccasionMatch(items, options.occasion)
  const weather = analyzeWeatherMatch(items, { ...(options.weather || {}), season: options.season })
  const balance = analyzeOutfitBalance(items)
  const layering = analyzeLayeringQuality(items)
  const rotation = scoreRotation(items, { usage: options.usage, recentlySuggested: options.recentlySuggested })
  const breakdown: StylistScoreBreakdown = {
    colorHarmony: color.score,
    occasionCompatibility: occasion.score,
    weatherCompatibility: weather.score,
    seasonCompatibility: seasonCompatibility(items, options.season),
    layeringQuality: Math.round((layering.score + balance.layerBalance) / 2),
    styleConsistency: styleConsistency(items),
    clothingDiversity: rotation.score,
    recentlyWornPenalty: rotation.penalty
  }
  const weighted = breakdown.colorHarmony * 0.16 +
    breakdown.occasionCompatibility * 0.17 +
    breakdown.weatherCompatibility * 0.18 +
    breakdown.seasonCompatibility * 0.08 +
    breakdown.layeringQuality * 0.14 +
    breakdown.styleConsistency * 0.11 +
    breakdown.clothingDiversity * 0.16 -
    (layering.impossible ? 40 : 0) -
    (color.badCombinations.length && !options.boldColor ? 12 : 0)
  return {
    score: clamp(weighted),
    breakdown,
    color,
    occasion,
    weather,
    layering
  }
}

