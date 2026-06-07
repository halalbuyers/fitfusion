import mongoose from 'mongoose'
import FashionProfile, { IFashionProfile } from '../models/FashionProfile'
import { normalizeCategory } from './fashion-analysis'

// Category definitions for different fashion types
const CATEGORY_PRESETS = {
  menswear: {
    tops: ['tshirt', 'shirt', 'hoodie'],
    bottoms: ['jeans', 'cargo', 'shorts'],
    shoes: ['sneakers', 'boots'],
    layers: ['jacket'],
    accessories: ['accessories']
  },
  womenswear: {
    tops: ['blouse', 'crop-top', 'shirt', 'tshirt'],
    bottoms: ['jeans', 'skirt', 'shorts', 'pants'],
    shoes: ['heels', 'sneakers', 'boots', 'flats'],
    layers: ['jacket', 'cardigan'],
    accessories: ['accessories', 'handbag']
  },
  both: {
    tops: ['tshirt', 'shirt', 'hoodie', 'blouse', 'crop-top'],
    bottoms: ['jeans', 'cargo', 'shorts', 'skirt', 'pants'],
    shoes: ['sneakers', 'boots', 'heels', 'flats'],
    layers: ['jacket', 'cardigan'],
    accessories: ['accessories', 'handbag']
  },
  'prefer-not-to-specify': {
    tops: ['tshirt', 'shirt', 'hoodie', 'blouse', 'crop-top'],
    bottoms: ['jeans', 'cargo', 'shorts', 'skirt', 'pants'],
    shoes: ['sneakers', 'boots', 'heels', 'flats'],
    layers: ['jacket', 'cardigan'],
    accessories: ['accessories', 'handbag']
  }
}

export async function getFashionProfile(userId: string): Promise<IFashionProfile | null> {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '')
    return await FashionProfile.findOne({ userId })
  } catch (error) {
    console.error('Error fetching fashion profile:', error)
    return null
  }
}

export function getCategoriesForFashionType(fashionType: string) {
  return CATEGORY_PRESETS[fashionType as keyof typeof CATEGORY_PRESETS] || CATEGORY_PRESETS['prefer-not-to-specify']
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

export function enhanceOutfitRequestWithProfile(
  request: any,
  profile: IFashionProfile | null
) {
  if (!profile) return request

  const categories = getCategoriesForFashionType(profile.fashionType)
  
  return {
    ...request,
    fashionType: profile.fashionType,
    preferredStyles: profile.preferredStyles,
    favoriteColors: profile.favoriteColors,
    dislikedColors: profile.dislikedColors,
    preferredOccasions: profile.preferredOccasions,
    fashionGoals: profile.fashionGoals,
    categoryPool: {
      tops: categories.tops,
      bottoms: categories.bottoms,
      shoes: categories.shoes,
      layers: categories.layers,
      accessories: categories.accessories
    }
  }
}

export function filterItemsByFashionProfile(
  items: any[],
  profile: IFashionProfile | null
) {
  if (!profile || !profile.fashionType) return items

  const categories = getCategoriesForFashionType(profile.fashionType)
  const allCategoriesAllowed = [
    ...categories.tops,
    ...categories.bottoms,
    ...categories.shoes,
    ...categories.layers,
    ...categories.accessories
  ]

  const dislikedColorSet = new Set(profile.dislikedColors?.map(c => c.toLowerCase()) || [])

  return items.filter(item => {
    // Allow items in the fashion type's category pool
    const itemCategory = String(item.category || '').toLowerCase()
    const categoryMatch = allCategoriesAllowed.some(cat => itemCategory.includes(cat))

    if (!categoryMatch) return false

    // Filter out disliked colors
    const itemColor = String(item.primaryColor || item.color || '').toLowerCase()
    if (itemColor && dislikedColorSet.has(itemColor)) {
      return false
    }

    return true
  })
}
