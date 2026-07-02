import { getColorCompatibilityScore, isNeutralColor, normalizeColor } from '../color-engine'
import { normalizeCategory, normalizeSeason, normalizeStyle } from '../fashion-analysis'
import type { ShoppingOccasion, ShoppingSeason, ShoppingWardrobeItem, WardrobeMatch } from './types'

export const topCategories: string[] = ['tshirt', 'shirt', 'hoodie', 'blouse', 'kurti', 'dress']
export const bottomCategories: string[] = ['jeans', 'cargo', 'shorts', 'skirt', 'chinos', 'trousers']
export const shoeCategories: string[] = ['sneakers', 'boots', 'heels', 'loafers', 'oxford-shoes', 'sandals']
export const layerCategories: string[] = ['jacket', 'blazer', 'coat', 'hoodie', 'overshirt']
export const accessoryCategories: string[] = ['accessories', 'handbag']

const formalCategories: string[] = ['shirt', 'blazer', 'trousers', 'loafers', 'oxford-shoes', 'boots', 'dress', 'heels']
const streetCategories: string[] = ['hoodie', 'cargo', 'sneakers', 'jacket', 'tshirt']
const officeCategories: string[] = ['shirt', 'chinos', 'trousers', 'blazer', 'loafers', 'oxford-shoes']

export function itemLabel(item: ShoppingWardrobeItem) {
  const color = normalizeColor(item.primaryColor || item.color || item.colors?.[0])
  const category = normalizeCategory(item.category)
  const brand = item.brand ? `${item.brand} ` : ''
  return `${brand}${color !== 'unknown' ? `${titleCase(color)} ` : ''}${titleCase(category)}`.trim()
}

export function titleCase(value: string) {
  return String(value || '')
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ''}${part.slice(1)}`)
    .join(' ')
}

export function normalizedCategory(item: Pick<ShoppingWardrobeItem, 'category'>): string {
  const raw = String(item.category || '').toLowerCase()
  if (raw.includes('chino')) return 'chinos'
  if (raw.includes('trouser')) return 'trousers'
  if (raw.includes('loafer')) return 'loafers'
  if (raw.includes('oxford')) return 'oxford-shoes'
  if (raw.includes('blazer')) return 'blazer'
  if (raw.includes('overshirt')) return 'overshirt'
  if (raw.includes('coat')) return 'coat'
  if (raw.includes('sandal')) return 'sandals'
  return normalizeCategory(item.category)
}

export function itemColors(item: Pick<ShoppingWardrobeItem, 'primaryColor' | 'color' | 'colors' | 'secondaryColors'>) {
  return [
    item.primaryColor,
    item.color,
    ...(item.colors || []),
    ...(item.secondaryColors || [])
  ].map((color) => normalizeColor(color)).filter((color) => color !== 'unknown')
}

export function hasSimilarItem(items: ShoppingWardrobeItem[], category: string, color: string) {
  const normalizedColor = normalizeColor(color)
  return items.filter((item) => {
    const sameCategory = normalizedCategory(item) === category
    const colors = itemColors(item)
    return sameCategory && (!normalizedColor || colors.includes(normalizedColor))
  }).length
}

export function countRole(items: ShoppingWardrobeItem[], categories: string[]) {
  return items.filter((item) => categories.includes(normalizedCategory(item))).length
}

export function outfitPotential(items: ShoppingWardrobeItem[]) {
  const tops = countRole(items, topCategories)
  const bottoms = countRole(items, bottomCategories)
  const shoes = countRole(items, shoeCategories)
  const layers = countRole(items, layerCategories)
  const accessories = countRole(items, accessoryCategories)
  const combos = Math.max(0, tops) * Math.max(1, bottoms) * Math.max(1, shoes) * Math.max(1, layers + 1) * Math.max(1, Math.min(3, accessories + 1))
  return {
    possibleOutfits: combos,
    roles: { tops, bottoms, shoes, layers, accessories }
  }
}

export function wardrobeScore(items: ShoppingWardrobeItem[]) {
  const potential = outfitPotential(items)
  const roleCoverage = [
    Math.min(100, potential.roles.tops * 14),
    Math.min(100, potential.roles.bottoms * 24),
    Math.min(100, potential.roles.shoes * 28),
    Math.min(100, potential.roles.layers * 18),
    Math.min(100, potential.roles.accessories * 20)
  ].reduce((sum, value) => sum + value, 0) / 5
  const neutralRatio = items.length
    ? items.filter((item) => itemColors(item).some((color) => isNeutralColor(color))).length / items.length
    : 0
  const colorScore = Math.round(Math.min(100, neutralRatio * 72 + Math.min(28, new Set(items.flatMap(itemColors)).size * 4)))
  const seasonScore = seasonCoverage(items).reduce((sum, entry) => sum + entry.score, 0) / 4
  const occasionScore = occasionCoverage(items).reduce((sum, entry) => sum + entry.score, 0) / 6
  const comboScore = Math.min(100, Math.round(Math.log10(Math.max(1, potential.possibleOutfits)) * 28))

  return Math.round(roleCoverage * 0.28 + colorScore * 0.18 + seasonScore * 0.2 + occasionScore * 0.2 + comboScore * 0.14)
}

export function seasonCoverage(items: ShoppingWardrobeItem[]) {
  const needs: Record<Exclude<ShoppingSeason, 'all-season'>, string[]> = {
    summer: ['tshirt', 'shirt', 'shorts', 'sneakers', 'sandals'],
    winter: ['hoodie', 'jacket', 'coat', 'boots'],
    spring: ['shirt', 'chinos', 'jeans', 'sneakers', 'jacket'],
    autumn: ['shirt', 'hoodie', 'jacket', 'jeans', 'boots']
  }
  const categories = items.map(normalizedCategory)
  return (Object.keys(needs) as Array<Exclude<ShoppingSeason, 'all-season'>>).map((season) => {
    const explicit = items.filter((item) => {
      const normalized = normalizeSeason(item.season)
      return normalized === season || normalized === 'all-season'
    }).length
    const needScore = needs[season].filter((category) => categories.includes(category)).length / needs[season].length
    const explicitScore = explicit / Math.max(1, items.length)
    return { season, score: Math.round(Math.min(100, needScore * 72 + explicitScore * 28)) }
  })
}

export function occasionCoverage(items: ShoppingWardrobeItem[]) {
  const needs: Record<string, string[]> = {
    casual: ['tshirt', 'shirt', 'jeans', 'sneakers'],
    office: officeCategories,
    formal: ['shirt', 'blazer', 'trousers', 'loafers', 'oxford-shoes'],
    party: ['shirt', 'jacket', 'jeans', 'boots', 'accessories'],
    travel: ['tshirt', 'hoodie', 'jacket', 'cargo', 'sneakers'],
    streetwear: streetCategories
  }
  const categories = items.map(normalizedCategory)
  return Object.entries(needs).map(([occasion, categoriesNeeded]) => {
    const tags = items.filter((item) => [...(item.occasion || []), ...(item.tags || [])].map(String).map((tag) => tag.toLowerCase()).includes(occasion)).length
    const covered = categoriesNeeded.filter((category) => categories.includes(category)).length
    return { occasion, score: Math.round(Math.min(100, (covered / categoriesNeeded.length) * 78 + (tags / Math.max(1, items.length)) * 22)) }
  })
}

export function categoryOccasionFit(category: string, occasion: ShoppingOccasion) {
  if (occasion === 'formal' || occasion === 'wedding') return formalCategories.includes(category) ? 92 : 52
  if (occasion === 'office') return officeCategories.includes(category) ? 90 : 56
  if (occasion === 'streetwear') return streetCategories.includes(category) ? 90 : 58
  if (occasion === 'gym') return ['tshirt', 'shorts', 'sneakers'].includes(category) ? 88 : 44
  if (occasion === 'travel') return ['tshirt', 'hoodie', 'jacket', 'cargo', 'sneakers', 'boots'].includes(category) ? 88 : 58
  return 72
}

export function matchWardrobeForProduct(
  items: ShoppingWardrobeItem[],
  product: { category: string; color: string; title?: string },
  limit = 8
): WardrobeMatch[] {
  const productCategory = product.category
  const productColor = normalizeColor(product.color)
  return items
    .map((item) => {
      const category = normalizedCategory(item)
      const color = itemColors(item)[0] || normalizeColor(item.primaryColor || item.color)
      const complementaryRole = productCategory !== category ? 18 : -18
      const colorScore = getColorCompatibilityScore(productColor, color)
      const roleScore = complementaryRole + (isUsefulPair(productCategory, category) ? 18 : 0)
      const styleScore = normalizeStyle(item.style) === 'formal' && ['loafers', 'blazer', 'shirt', 'chinos'].includes(productCategory) ? 8 : 0
      const compatibility = Math.max(0, Math.min(100, Math.round(colorScore * 0.68 + 24 + roleScore + styleScore)))
      return {
        id: String(item._id || item.id || item.image || itemLabel(item)),
        label: itemLabel(item),
        category,
        color,
        image: item.image,
        compatibility,
        reason: `${titleCase(productColor)} works with ${titleCase(color)} and the ${titleCase(category)} role.`
      }
    })
    .filter((match) => match.compatibility >= 64)
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, limit)
}

function isUsefulPair(a: string, b: string) {
  const groups = [
    [topCategories, bottomCategories],
    [topCategories, shoeCategories],
    [bottomCategories, shoeCategories],
    [layerCategories, topCategories],
    [layerCategories, bottomCategories],
    [accessoryCategories, topCategories],
    [accessoryCategories, layerCategories]
  ]
  return groups.some(([left, right]) => (left.includes(a) && right.includes(b)) || (left.includes(b) && right.includes(a)))
}

export function strongestAndWeakestOccasion(items: ShoppingWardrobeItem[]) {
  const coverage = occasionCoverage(items).sort((a, b) => b.score - a.score)
  return {
    strongest: titleCase(coverage[0]?.occasion || 'casual'),
    weakest: titleCase(coverage[coverage.length - 1]?.occasion || 'formal')
  }
}

export function demoWardrobe(): ShoppingWardrobeItem[] {
  return [
    { id: 'demo-black-jeans', category: 'jeans', primaryColor: 'black', style: 'minimal', season: 'all-season', occasion: ['casual', 'party'], wearCount: 14 },
    { id: 'demo-blue-jeans', category: 'jeans', primaryColor: 'blue', style: 'casual', season: 'all-season', occasion: ['casual', 'college'], wearCount: 18 },
    { id: 'demo-grey-hoodie', category: 'hoodie', primaryColor: 'gray', style: 'streetwear', season: 'winter', occasion: ['college', 'travel'], wearCount: 10 },
    { id: 'demo-white-tee', category: 'tshirt', primaryColor: 'white', style: 'minimal', season: 'summer', occasion: ['casual', 'gym'], wearCount: 21 },
    { id: 'demo-black-tee', category: 'tshirt', primaryColor: 'black', style: 'minimal', season: 'all-season', occasion: ['casual', 'party'], wearCount: 13 },
    { id: 'demo-olive-jacket', category: 'jacket', primaryColor: 'olive', style: 'casual', season: 'autumn', occasion: ['travel', 'streetwear'], wearCount: 7 },
    { id: 'demo-cargo', category: 'cargo', primaryColor: 'black', style: 'streetwear', season: 'all-season', occasion: ['streetwear', 'travel'], wearCount: 9 },
    { id: 'demo-denim-shirt', category: 'shirt', primaryColor: 'light blue', style: 'casual', season: 'spring', occasion: ['casual', 'college'], wearCount: 6 }
  ]
}

