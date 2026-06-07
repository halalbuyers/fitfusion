import { normalizeCategory } from './fashion-analysis'

export const CATEGORY_PRESETS = {
  menswear: {
    tops: ['tshirt', 'shirt', 'hoodie'],
    bottoms: ['jeans', 'cargo', 'shorts'],
    shoes: ['sneakers', 'boots'],
    layers: ['jacket'],
    accessories: ['accessories']
  },
  womenswear: {
    tops: ['dress', 'blouse', 'kurti', 'crop-top', 'shirt', 'tshirt'],
    bottoms: ['jeans', 'skirt', 'shorts', 'pants'],
    shoes: ['heels', 'sneakers', 'boots', 'flats'],
    layers: ['jacket', 'cardigan'],
    accessories: ['accessories', 'handbag']
  },
  both: {
    tops: ['dress', 'blouse', 'kurti', 'tshirt', 'shirt', 'hoodie', 'crop-top'],
    bottoms: ['jeans', 'cargo', 'shorts', 'skirt', 'pants'],
    shoes: ['sneakers', 'boots', 'heels', 'flats'],
    layers: ['jacket', 'cardigan'],
    accessories: ['accessories', 'handbag']
  },
  'prefer-not-to-specify': {
    tops: ['dress', 'blouse', 'kurti', 'tshirt', 'shirt', 'hoodie', 'crop-top'],
    bottoms: ['jeans', 'cargo', 'shorts', 'skirt', 'pants'],
    shoes: ['sneakers', 'boots', 'heels', 'flats'],
    layers: ['jacket', 'cardigan'],
    accessories: ['accessories', 'handbag']
  }
} as const

export type FashionTypeCategorySets = typeof CATEGORY_PRESETS[keyof typeof CATEGORY_PRESETS]
export type FashionType = keyof typeof CATEGORY_PRESETS

export function getCategoriesForFashionType(fashionType: string) {
  return CATEGORY_PRESETS[fashionType as keyof typeof CATEGORY_PRESETS] || CATEGORY_PRESETS['prefer-not-to-specify']
}

export function getAllowedCategoriesForFashionType(fashionType: string) {
  const categories = getCategoriesForFashionType(fashionType)
  return [
    ...new Set([
      'unknown',
      ...categories.tops,
      ...categories.bottoms,
      ...categories.shoes,
      ...categories.layers,
      ...categories.accessories
    ])
  ]
}

export function isCategoryAllowedForFashionType(category: string | undefined, fashionType: string) {
  const normalizedCategory = normalizeCategory(category)
  const rawCategory = String(category || '').trim().toLowerCase()
  const categories = getCategoriesForFashionType(fashionType)
  const allowed = [
    ...categories.tops,
    ...categories.bottoms,
    ...categories.shoes,
    ...categories.layers,
    ...categories.accessories
  ]

  return allowed.includes(normalizedCategory) || allowed.includes(rawCategory)
}

export function sanitizeCategoryForFashionType(category: string | undefined, fashionType: string) {
  if (!category) return 'unknown'
  const rawCategory = String(category).trim().toLowerCase()
  if (isCategoryAllowedForFashionType(rawCategory, fashionType)) {
    const normalizedCategory = normalizeCategory(rawCategory)
    return normalizedCategory !== 'unknown' ? normalizedCategory : rawCategory
  }
  return 'unknown'
}
