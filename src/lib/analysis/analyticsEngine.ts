import { analyzeColorDistribution } from './colorAnalyzer'
import { detectDuplicates } from './duplicateDetector'
import { analyzeOccasionCoverage } from './occasionAnalyzer'
import { analyzeSeasonCoverage } from './seasonAnalyzer'
import { outfitPotential, recommendShopping } from './shoppingAdvisor'
import { detectUnusedItems } from './unusedDetector'
import { scoreWardrobeHealth } from './wardrobeScore'
import type { AnalysisWardrobeItem } from './types'

const cache = new Map<string, any>()

function signature(items: AnalysisWardrobeItem[]) {
  return items.map((item) => [
    item._id || item.id || item.image,
    item.category,
    item.primaryColor || item.color,
    item.style,
    item.season,
    item.wearCount || item.usageCount || 0,
    item.lastWornAt || ''
  ].join(':')).sort().join('|')
}

export type WardrobeConsultantAnalysis = ReturnType<typeof buildWardrobeConsultantAnalysis>

export function buildWardrobeConsultantAnalysis(items: AnalysisWardrobeItem[]) {
  const key = signature(items)
  const cached = cache.get(key)
  if (cached) return cached

  const colorAnalysis = analyzeColorDistribution(items)
  const duplicates = detectDuplicates(items)
  const seasonCoverage = analyzeSeasonCoverage(items)
  const occasionCoverage = analyzeOccasionCoverage(items)
  const unusedItems = detectUnusedItems(items)
  const potential = outfitPotential(items)
  const shoppingRecommendations = recommendShopping(items)
  const wardrobeScore = scoreWardrobeHealth({
    items,
    colors: colorAnalysis,
    seasons: seasonCoverage,
    occasions: occasionCoverage,
    duplicates,
    unused: unusedItems,
    possibleOutfits: potential.possibleOutfits
  })
  const favoriteItems = {
    mostWorn: [...items].sort((a, b) => Number(b.wearCount || b.usageCount || 0) - Number(a.wearCount || a.usageCount || 0)).slice(0, 5),
    leastWorn: [...items].sort((a, b) => Number(a.wearCount || a.usageCount || 0) - Number(b.wearCount || b.usageCount || 0)).slice(0, 5),
    mostVersatile: [...items].sort((a, b) => Number(b.itemPreferenceScore || 0) - Number(a.itemPreferenceScore || 0)).slice(0, 5),
    highestRated: [...items].sort((a, b) => Number(b.itemPreferenceScore || 0) - Number(a.itemPreferenceScore || 0)).slice(0, 5)
  }
  const tips = [
    colorAnalysis.imbalance[0],
    occasionCoverage.find((entry) => entry.score < 45)?.recommendation,
    seasonCoverage.find((entry) => entry.score < 45)?.recommendation,
    duplicates[0] ? `${duplicates[0].label} looks duplicated. ${duplicates[0].recommendation}` : '',
    shoppingRecommendations[0] ? `Adding ${shoppingRecommendations[0].title} could create ${shoppingRecommendations[0].estimatedNewCombinations} new combinations.` : ''
  ].filter(Boolean) as string[]

  const analysis = {
    wardrobeScore,
    colorAnalysis,
    seasonCoverage,
    occasionCoverage,
    duplicates,
    missingEssentials: shoppingRecommendations,
    shoppingRecommendations,
    unusedItems,
    outfitPotential: potential,
    favoriteItems,
    tips: tips.length ? tips.slice(0, 6) : ['Your wardrobe has a healthy foundation. Keep tracking wears to sharpen future recommendations.'],
    recentUploads: [...items].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 6)
  }

  if (cache.size > 24) cache.clear()
  cache.set(key, analysis)
  return analysis
}
