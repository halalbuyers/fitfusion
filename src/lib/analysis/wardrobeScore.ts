import type { AnalysisWardrobeItem, CoverageMetric } from './types'
import type { WardrobeColorAnalysis } from './colorAnalyzer'
import type { DuplicateGroup } from './duplicateDetector'
import type { UnusedWardrobeItem } from './unusedDetector'

export type WardrobeHealthScore = {
  score: number
  label: string
  factors: Record<string, number>
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
}

export function scoreWardrobeHealth(input: {
  items: AnalysisWardrobeItem[]
  colors: WardrobeColorAnalysis
  seasons: CoverageMetric[]
  occasions: CoverageMetric[]
  duplicates: DuplicateGroup[]
  unused: UnusedWardrobeItem[]
  possibleOutfits: number
}) {
  const categories = new Set(input.items.map((item) => item.category).filter(Boolean)).size
  const variety = Math.min(100, categories * 10 + Math.min(30, input.items.length * 1.5))
  const seasonalCoverage = average(input.seasons.map((season) => season.score))
  const occasionCoverage = average(input.occasions.map((occasion) => occasion.score))
  const duplicateScore = Math.max(0, 100 - input.duplicates.reduce((sum, group) => sum + group.count * 7, 0))
  const completeness = Math.min(100, input.items.length * 4 + categories * 5)
  const condition = input.items.some((item) => item.condition) ? 82 : 72
  const outfitPotential = Math.min(100, Math.round(Math.log10(Math.max(1, input.possibleOutfits)) * 28))
  const unusedScore = Math.max(0, 100 - input.unused.length * 4)
  const factors = {
    variety: Math.round(variety),
    colorBalance: input.colors.balanceScore,
    seasonalCoverage: Math.round(seasonalCoverage),
    occasionCoverage: Math.round(occasionCoverage),
    duplicateControl: duplicateScore,
    completeness: Math.round(completeness),
    condition,
    outfitPotential,
    rotation: unusedScore
  }
  const score = Math.max(0, Math.min(100, Math.round(
    factors.variety * 0.13 +
    factors.colorBalance * 0.13 +
    factors.seasonalCoverage * 0.13 +
    factors.occasionCoverage * 0.14 +
    factors.duplicateControl * 0.1 +
    factors.completeness * 0.13 +
    factors.condition * 0.06 +
    factors.outfitPotential * 0.13 +
    factors.rotation * 0.05
  )))
  const label = score >= 88 ? 'Excellent' : score >= 74 ? 'Strong' : score >= 58 ? 'Average' : 'Limited'
  return { score, label, factors } satisfies WardrobeHealthScore
}

