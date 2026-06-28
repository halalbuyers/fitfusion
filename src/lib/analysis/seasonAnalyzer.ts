import { normalizeCategory } from '../fashion-analysis'
import type { AnalysisWardrobeItem, CoverageMetric } from './types'

const seasons = ['summer', 'winter', 'spring', 'autumn'] as const
const seasonNeeds: Record<string, string[]> = {
  summer: ['tshirt', 'shirt', 'shorts', 'sneakers', 'sandals'],
  winter: ['hoodie', 'jacket', 'coat', 'sweater', 'boots'],
  spring: ['shirt', 'polo', 'jeans', 'chinos', 'sneakers', 'jacket'],
  autumn: ['shirt', 'hoodie', 'jacket', 'jeans', 'boots']
}

export function analyzeSeasonCoverage(items: AnalysisWardrobeItem[]): CoverageMetric[] {
  const categories = items.map((item) => String(normalizeCategory(item.category)))
  return seasons.map((season) => {
    const explicit = items.filter((item) => [season, 'all-season'].includes(String(item.season || 'all-season').toLowerCase())).length
    const coveredNeeds = seasonNeeds[season].filter((need) => categories.includes(need)).length
    const score = Math.max(0, Math.min(100, Math.round((explicit / Math.max(1, items.length)) * 38 + (coveredNeeds / seasonNeeds[season].length) * 62)))
    const missing = seasonNeeds[season].filter((need) => !categories.includes(need)).slice(0, 3)
    return {
      key: season,
      label: season[0].toUpperCase() + season.slice(1),
      score,
      count: explicit,
      missing,
      recommendation: missing.length ? `Add ${missing.join(', ')} for stronger ${season} coverage.` : `${season} coverage is healthy.`
    }
  })
}
