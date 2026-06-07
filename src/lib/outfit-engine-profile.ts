import mongoose from 'mongoose'
import FashionProfile, { IFashionProfile } from '../models/FashionProfile'
import { normalizeCategory } from './fashion-analysis'
import {
  getCategoriesForFashionType,
  getAllowedCategoriesForFashionType,
  isCategoryAllowedForFashionType,
  sanitizeCategoryForFashionType
} from './fashion-profile-categories'

export async function getFashionProfile(userId: string): Promise<IFashionProfile | null> {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '')
    return await FashionProfile.findOne({ userId })
  } catch (error) {
    console.error('Error fetching fashion profile:', error)
    return null
  }
}

export { getCategoriesForFashionType, getAllowedCategoriesForFashionType, isCategoryAllowedForFashionType, sanitizeCategoryForFashionType } from './fashion-profile-categories'

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
  const allCategoriesAllowed: string[] = [
    ...categories.tops,
    ...categories.bottoms,
    ...categories.shoes,
    ...categories.layers,
    ...categories.accessories
  ]

  const dislikedColorSet = new Set(profile.dislikedColors?.map(c => c.toLowerCase()) || [])

  return items.filter(item => {
    // Allow items in the fashion type's category pool
    const itemCategory = String(item.category || '').trim().toLowerCase()
    const categoryMatch = allCategoriesAllowed.includes(itemCategory)

    if (!categoryMatch) return false

    // Filter out disliked colors
    const itemColor = String(item.primaryColor || item.color || '').toLowerCase()
    if (itemColor && dislikedColorSet.has(itemColor)) {
      return false
    }

    return true
  })
}
