import { normalizeCategory, normalizeStyle } from '../fashion-analysis'
import type { AnalysisWardrobeItem, CoverageMetric } from './types'

const occasions = ['casual', 'college', 'office', 'gym', 'party', 'wedding', 'travel', 'home', 'streetwear'] as const
const needs: Record<string, { categories: string[]; styles: string[] }> = {
  casual: { categories: ['tshirt', 'shirt', 'jeans', 'shorts', 'sneakers'], styles: ['casual', 'minimal'] },
  college: { categories: ['tshirt', 'hoodie', 'jeans', 'cargo', 'sneakers'], styles: ['casual', 'streetwear'] },
  office: { categories: ['shirt', 'chinos', 'trousers', 'blazer', 'loafers'], styles: ['formal', 'minimal', 'old-money'] },
  gym: { categories: ['tshirt', 'shorts', 'sneakers'], styles: ['sporty'] },
  party: { categories: ['shirt', 'jacket', 'jeans', 'boots', 'heels', 'accessories'], styles: ['streetwear', 'formal', 'y2k'] },
  wedding: { categories: ['dress-shirt', 'shirt', 'blazer', 'trousers', 'loafers', 'oxford-shoes', 'dress', 'heels'], styles: ['formal', 'old-money'] },
  travel: { categories: ['tshirt', 'hoodie', 'jacket', 'cargo', 'sneakers'], styles: ['casual', 'techwear'] },
  home: { categories: ['tshirt', 'hoodie', 'shorts', 'slides'], styles: ['casual', 'sporty'] },
  streetwear: { categories: ['tshirt', 'hoodie', 'jacket', 'cargo', 'sneakers'], styles: ['streetwear', 'y2k', 'techwear'] }
}

function itemMatchesOccasion(item: AnalysisWardrobeItem, occasion: string) {
  const tags = [...(item.occasion || []), ...(item.tags || [])].map((tag) => String(tag).toLowerCase())
  const category = normalizeCategory(item.category)
  const style = normalizeStyle(item.style)
  return tags.includes(occasion) || needs[occasion].categories.includes(category) || needs[occasion].styles.includes(style)
}

export function analyzeOccasionCoverage(items: AnalysisWardrobeItem[]): CoverageMetric[] {
  const categories = items.map((item) => String(normalizeCategory(item.category)))
  return occasions.map((occasion) => {
    const matching = items.filter((item) => itemMatchesOccasion(item, occasion))
    const coveredNeeds = needs[occasion].categories.filter((category) => categories.includes(category)).length
    const score = Math.max(0, Math.min(100, Math.round((matching.length / Math.max(1, items.length)) * 32 + (coveredNeeds / needs[occasion].categories.length) * 68)))
    const missing = needs[occasion].categories.filter((category) => !categories.includes(category)).slice(0, 3)
    return {
      key: occasion,
      label: occasion[0].toUpperCase() + occasion.slice(1),
      score,
      count: matching.length,
      missing,
      recommendation: missing.length ? `Missing ${missing.join(', ')} limits ${occasion} outfits.` : `${occasion} outfits are well covered.`
    }
  })
}
