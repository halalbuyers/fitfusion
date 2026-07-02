import { getColorCompatibilityScore, normalizeColor } from '../color-engine'
import type { GapRecommendation, ShoppingWardrobeItem, WardrobeEssential } from './types'
import {
  hasSimilarItem,
  matchWardrobeForProduct,
  occasionCoverage,
  outfitPotential,
  seasonCoverage,
  titleCase,
  wardrobeScore
} from './wardrobeMath'

export const wardrobeEssentials: WardrobeEssential[] = [
  {
    id: 'white-sneakers',
    title: 'White Sneakers',
    category: 'sneakers',
    color: 'white',
    reason: 'A clean neutral shoe connects denim, cargos, tees, hoodies, casual shirts, and travel layers without making the outfit feel busy.',
    priority: 'critical',
    seasonBoost: ['summer', 'spring', 'autumn', 'all-season'],
    occasionBoost: ['casual', 'college', 'travel', 'streetwear', 'date'],
    versatilityTags: ['neutral', 'daily', 'travel', 'minimal'],
    searchTags: ['white sneakers', 'minimal sneakers', 'leather sneakers'],
    materialHints: ['leather', 'canvas'],
    basePriceTarget: 3500
  },
  {
    id: 'black-loafers',
    title: 'Black Loafers',
    category: 'loafers',
    color: 'black',
    reason: 'Black loafers raise the formality ceiling of casual trousers, denim, shirts, and blazers without needing a full suit.',
    priority: 'high',
    seasonBoost: ['spring', 'autumn', 'all-season'],
    occasionBoost: ['office', 'formal', 'date', 'wedding'],
    versatilityTags: ['formal', 'smart casual', 'office'],
    searchTags: ['black loafers', 'penny loafers', 'leather loafers'],
    materialHints: ['leather', 'suede'],
    basePriceTarget: 4200
  },
  {
    id: 'beige-chinos',
    title: 'Beige Chinos',
    category: 'chinos',
    color: 'beige',
    reason: 'Beige chinos bridge casual and polished looks, especially with navy, white, olive, black, brown, and denim pieces.',
    priority: 'high',
    seasonBoost: ['summer', 'spring', 'autumn', 'all-season'],
    occasionBoost: ['casual', 'office', 'date', 'travel'],
    versatilityTags: ['smart casual', 'neutral', 'light base'],
    searchTags: ['beige chinos', 'khaki trousers', 'stretch chinos'],
    materialHints: ['cotton twill', 'stretch cotton'],
    basePriceTarget: 2800
  },
  {
    id: 'navy-blazer',
    title: 'Navy Blazer',
    category: 'blazer',
    color: 'navy',
    reason: 'A navy blazer turns tees, shirts, denim, chinos, and loafers into office, dinner, and event outfits.',
    priority: 'high',
    seasonBoost: ['spring', 'autumn', 'winter', 'all-season'],
    occasionBoost: ['office', 'formal', 'date', 'wedding'],
    versatilityTags: ['tailored', 'formal', 'layer'],
    searchTags: ['navy blazer', 'unstructured blazer', 'tailored blazer'],
    materialHints: ['cotton blend', 'wool blend'],
    basePriceTarget: 6500
  },
  {
    id: 'white-oxford-shirt',
    title: 'White Oxford Shirt',
    category: 'shirt',
    color: 'white',
    reason: 'A white Oxford is the highest-leverage top for office, dates, weddings, and smart casual outfits.',
    priority: 'critical',
    seasonBoost: ['summer', 'spring', 'autumn', 'all-season'],
    occasionBoost: ['office', 'formal', 'date', 'wedding', 'casual'],
    versatilityTags: ['formal', 'neutral top', 'layerable'],
    searchTags: ['white oxford shirt', 'button down shirt', 'cotton oxford'],
    materialHints: ['cotton oxford'],
    basePriceTarget: 2400
  },
  {
    id: 'black-chelsea-boots',
    title: 'Black Chelsea Boots',
    category: 'boots',
    color: 'black',
    reason: 'Black Chelsea boots add polish and weather resilience while improving party, winter, travel, and formal outfits.',
    priority: 'medium',
    seasonBoost: ['winter', 'autumn'],
    occasionBoost: ['party', 'formal', 'travel', 'date'],
    versatilityTags: ['winter', 'formal', 'night out'],
    searchTags: ['black chelsea boots', 'leather boots'],
    materialHints: ['leather', 'suede'],
    basePriceTarget: 5200
  },
  {
    id: 'beige-overshirt',
    title: 'Beige Overshirt',
    category: 'overshirt',
    color: 'beige',
    reason: 'A beige overshirt gives your tees and denim a soft layer that works across warm evenings, travel days, and casual office looks.',
    priority: 'medium',
    seasonBoost: ['spring', 'autumn', 'all-season'],
    occasionBoost: ['casual', 'travel', 'date', 'streetwear'],
    versatilityTags: ['layer', 'neutral', 'transitional'],
    searchTags: ['beige overshirt', 'cotton overshirt', 'shacket'],
    materialHints: ['cotton twill', 'canvas'],
    basePriceTarget: 3600
  }
]

export function analyzeWardrobeGaps(items: ShoppingWardrobeItem[]): GapRecommendation[] {
  const currentPotential = outfitPotential(items)
  const currentScore = wardrobeScore(items)
  const currentSeasons = seasonCoverage(items)
  const currentOccasions = occasionCoverage(items)

  return wardrobeEssentials
    .map((essential) => {
      const ownedSimilarCount = hasSimilarItem(items, essential.category, essential.color)
      const simulatedItem: ShoppingWardrobeItem = {
        id: `sim-${essential.id}`,
        category: essential.category,
        primaryColor: essential.color,
        color: essential.color,
        colors: [essential.color],
        season: 'all-season',
        style: essential.occasionBoost.includes('formal') ? 'formal' : 'minimal',
        occasion: essential.occasionBoost,
        tags: essential.versatilityTags,
        material: essential.materialHints[0]
      }
      const nextItems = [...items, simulatedItem]
      const nextPotential = outfitPotential(nextItems)
      const nextScore = wardrobeScore(nextItems)
      const nextSeasons = seasonCoverage(nextItems)
      const nextOccasions = occasionCoverage(nextItems)
      const matchedWardrobe = matchWardrobeForProduct(items, {
        category: essential.category,
        color: essential.color,
        title: essential.title
      }, 10)
      const seasonalImprovement = improvementFor(currentSeasons.map((entry) => entry.score), nextSeasons.map((entry) => entry.score))
      const occasionImprovement = improvementFor(currentOccasions.map((entry) => entry.score), nextOccasions.map((entry) => entry.score))
      const newOutfitCombinations = Math.max(1, nextPotential.possibleOutfits - currentPotential.possibleOutfits)
      const versatility = Math.round(Math.min(100, matchedWardrobe.length * 9 + neutralBonus(essential.color) + essential.occasionBoost.length * 7 + essential.seasonBoost.length * 5 - ownedSimilarCount * 18))
      const wardrobeScoreImprovement = Math.max(1, nextScore - currentScore)
      const aiRecommendationScore = Math.round(Math.min(99, wardrobeScoreImprovement * 4 + Math.log10(newOutfitCombinations + 10) * 18 + versatility * 0.42 + priorityBoost(essential.priority) - ownedSimilarCount * 22))
      const complementPercent = items.length ? Math.round((matchedWardrobe.length / items.length) * 100) : 0
      const skipReason = ownedSimilarCount > 0
        ? `Skip or deprioritize: you already own ${ownedSimilarCount} similar ${titleCase(essential.color)} ${titleCase(essential.category)} item${ownedSimilarCount > 1 ? 's' : ''}.`
        : undefined

      return {
        ...essential,
        impact: {
          newOutfitCombinations,
          wardrobeScoreImprovement,
          seasonalImprovement,
          occasionImprovement,
          versatility,
          aiRecommendationScore
        },
        ownedSimilarCount,
        matchedWardrobe,
        explanation: `${essential.title} complements ${complementPercent}% of your wardrobe and improves ${topBoostLabel(essential.occasionBoost)} coverage.`,
        skipReason
      } satisfies GapRecommendation
    })
    .filter((recommendation) => recommendation.ownedSimilarCount === 0 || recommendation.impact.aiRecommendationScore >= 58)
    .sort((a, b) => b.impact.aiRecommendationScore - a.impact.aiRecommendationScore)
}

export function findBestGapForProduct(gaps: GapRecommendation[], category: string, color: string) {
  const normalizedProductColor = normalizeColor(color)
  return [...gaps].sort((a, b) => {
    const aCategory = a.category === category ? 30 : 0
    const bCategory = b.category === category ? 30 : 0
    const aColor = getColorCompatibilityScore(a.color, normalizedProductColor)
    const bColor = getColorCompatibilityScore(b.color, normalizedProductColor)
    return bCategory + bColor + b.impact.aiRecommendationScore - (aCategory + aColor + a.impact.aiRecommendationScore)
  })[0]
}

function improvementFor(before: number[], after: number[]) {
  const beforeAverage = before.reduce((sum, value) => sum + value, 0) / Math.max(1, before.length)
  const afterAverage = after.reduce((sum, value) => sum + value, 0) / Math.max(1, after.length)
  return Math.max(0, Math.round(afterAverage - beforeAverage))
}

function priorityBoost(priority: WardrobeEssential['priority']) {
  if (priority === 'critical') return 16
  if (priority === 'high') return 10
  if (priority === 'medium') return 5
  return 0
}

function neutralBonus(color: string) {
  return ['black', 'white', 'gray', 'navy', 'beige', 'tan', 'brown', 'cream'].includes(normalizeColor(color)) ? 20 : 6
}

function topBoostLabel(occasions: string[]) {
  return occasions.slice(0, 2).join(' and ')
}

export function summarizeMissingEssentials(items: ShoppingWardrobeItem[]) {
  return wardrobeEssentials
    .filter((essential) => hasSimilarItem(items, essential.category, essential.color) === 0)
    .map((essential) => essential.title)
}

