import { normalizeCategory } from '../fashion-analysis'
import type { AnalysisWardrobeItem, ImpactRecommendation } from './types'

const essentials: Array<{ title: string; category: string; color?: string; reason: string; priority: ImpactRecommendation['priority'] }> = [
  { title: 'White Sneakers', category: 'sneakers', color: 'white', reason: 'A clean neutral shoe connects casual, college, travel, and streetwear outfits.', priority: 'high' },
  { title: 'Black Jeans', category: 'jeans', color: 'black', reason: 'Dark denim adds an easy base for casual and party combinations.', priority: 'high' },
  { title: 'White Oxford Shirt', category: 'shirt', color: 'white', reason: 'A crisp white shirt expands office, formal, wedding, and smart casual options.', priority: 'high' },
  { title: 'Grey Hoodie', category: 'hoodie', color: 'gray', reason: 'A grey hoodie creates lighter layering without repeating black.', priority: 'medium' },
  { title: 'Beige Chinos', category: 'chinos', color: 'beige', reason: 'Beige chinos unlock polished outfits with navy, white, olive, and brown.', priority: 'medium' },
  { title: 'Black Boots', category: 'boots', color: 'black', reason: 'Black boots improve winter, party, travel, and smart casual coverage.', priority: 'medium' }
]

function colors(item: AnalysisWardrobeItem) {
  return [item.primaryColor || item.color, ...(item.colors || [])].map((value) => String(value || '').toLowerCase())
}

function hasEssential(items: AnalysisWardrobeItem[], category: string, color?: string) {
  return items.some((item) => normalizeCategory(item.category) === category && (!color || colors(item).includes(color)))
}

export function outfitPotential(items: AnalysisWardrobeItem[]) {
  const count = (terms: string[]) => items.filter((item) => terms.includes(normalizeCategory(item.category))).length
  const tops = count(['tshirt', 'shirt', 'hoodie', 'blouse', 'dress'])
  const bottoms = count(['jeans', 'cargo', 'shorts', 'skirt', 'chinos', 'trousers'])
  const shoes = count(['sneakers', 'boots', 'heels', 'loafers', 'oxford-shoes', 'sandals'])
  const layers = count(['jacket', 'blazer', 'coat', 'hoodie'])
  const accessories = count(['accessories'])
  const possibleOutfits = tops * Math.max(1, bottoms) * Math.max(1, shoes) * Math.max(1, 1 + layers) * Math.max(1, Math.min(3, 1 + accessories))
  const trend = possibleOutfits >= 1200 ? 'Excellent' : possibleOutfits >= 300 ? 'Average' : 'Limited'
  return { possibleOutfits, trend, roles: { tops, bottoms, shoes, layers, accessories } }
}

export function recommendShopping(items: AnalysisWardrobeItem[]): ImpactRecommendation[] {
  const current = outfitPotential(items)
  return essentials
    .filter((essential) => !hasEssential(items, essential.category, essential.color))
    .map((essential) => {
      const next = outfitPotential([...items, { category: essential.category, primaryColor: essential.color }])
      const delta = Math.max(1, next.possibleOutfits - current.possibleOutfits)
      const percent = Math.round((delta / Math.max(1, current.possibleOutfits)) * 100)
      return { ...essential, estimatedNewCombinations: delta, estimatedImprovementPercent: percent }
    })
    .sort((a, b) => b.estimatedNewCombinations - a.estimatedNewCombinations)
    .slice(0, 6)
}

