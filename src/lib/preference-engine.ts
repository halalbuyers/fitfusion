export type UserPreferenceProfile = {
  favoriteColors: string[]
  favoriteCategories: string[]
  favoriteStyles: string[]
  favoriteSeasons: string[]
  likedOutfitKeys: string[]
  correctedCategories: Array<{ predictedCategory: string; correctedCategory: string; count?: number }>
  correctedColors: Array<{ predictedColor: string; correctedColor: string; count?: number }>
  preferredStyles: string[]
  preferredColors: string[]
  avoidedColors: string[]
  favoriteOccasions: string[]
  dislikedColors: string[]
  dislikedStyles: string[]
  dislikedCategories: string[]
  dislikedSeasons: string[]
  dislikedOccasions: string[]
  rejectedOutfitKeys: string[]
  favoriteOutfitKeys: string[]
  favoriteItems: string[]
  rejectedItems: string[]
  overusedItems: string[]
}

export const emptyPreferenceProfile: UserPreferenceProfile = {
  favoriteColors: [],
  favoriteCategories: [],
  favoriteStyles: [],
  favoriteSeasons: [],
  likedOutfitKeys: [],
  correctedCategories: [],
  correctedColors: [],
  preferredStyles: [],
  preferredColors: [],
  avoidedColors: [],
  favoriteOccasions: [],
  dislikedColors: [],
  dislikedStyles: [],
  dislikedCategories: [],
  dislikedSeasons: [],
  dislikedOccasions: [],
  rejectedOutfitKeys: [],
  favoriteOutfitKeys: [],
  favoriteItems: [],
  rejectedItems: [],
  overusedItems: []
}

function topValues(values: string[], limit = 4) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value.trim().toLowerCase()
    if (!key) return acc
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value]) => value)
}

export function buildPreferenceProfile(items: Array<{ style?: string; primaryColor?: string; color?: string; colors?: string[]; category?: string; favorite?: boolean; isFavorite?: boolean; wearCount?: number; usageCount?: number; itemPreferenceScore?: number }>, stored?: Partial<UserPreferenceProfile>): UserPreferenceProfile {
  const favoriteItems = items.filter((item) => item.favorite || item.isFavorite || Number(item.wearCount || item.usageCount || 0) > 1)
  const source = favoriteItems.length ? favoriteItems : items
  const preferredStyles = topValues([...source.map((item) => item.style || ''), ...(stored?.preferredStyles || []), ...(stored?.favoriteStyles || [])])
  const preferredColors = topValues([...source.flatMap((item) => [item.primaryColor || item.color || '', ...(item.colors || [])]), ...(stored?.preferredColors || []), ...(stored?.favoriteColors || [])])
  const favoriteCategories = topValues([...source.map((item) => item.category || ''), ...(stored?.favoriteCategories || [])])
  const favoriteSeasons = [...new Set((stored?.favoriteSeasons || []).map((season) => season.toLowerCase()))]

  return {
    favoriteColors: preferredColors,
    favoriteCategories,
    favoriteStyles: preferredStyles,
    favoriteSeasons,
    likedOutfitKeys: [...new Set((stored?.likedOutfitKeys || []).map(String))],
    correctedCategories: stored?.correctedCategories || [],
    correctedColors: stored?.correctedColors || [],
    preferredStyles,
    preferredColors,
    avoidedColors: [...new Set((stored?.avoidedColors || []).map((color) => color.toLowerCase()))],
    favoriteOccasions: [...new Set((stored?.favoriteOccasions || []).map((occasion) => occasion.toLowerCase()))],
    dislikedColors: [...new Set((stored?.dislikedColors || []).map((color) => color.toLowerCase()))],
    dislikedStyles: [...new Set((stored?.dislikedStyles || []).map((style) => style.toLowerCase()))],
    dislikedCategories: [...new Set((stored?.dislikedCategories || []).map((category) => category.toLowerCase()))],
    dislikedSeasons: [...new Set((stored?.dislikedSeasons || []).map((season) => season.toLowerCase()))],
    dislikedOccasions: [...new Set((stored?.dislikedOccasions || []).map((occasion) => occasion.toLowerCase()))],
    rejectedOutfitKeys: [...new Set((stored?.rejectedOutfitKeys || []).map(String))],
    favoriteOutfitKeys: [...new Set((stored?.favoriteOutfitKeys || []).map(String))],
    favoriteItems: [...new Set((stored?.favoriteItems || []).map(String))],
    rejectedItems: [...new Set((stored?.rejectedItems || []).map(String))],
    overusedItems: [...new Set((stored?.overusedItems || []).map(String))]
  }
}

function itemId(item: { _id?: string; id?: string; image?: string; category?: string; primaryColor?: string; color?: string }) {
  return String(item._id || item.id || item.image || `${item.category}-${item.primaryColor || item.color}`)
}

export function preferenceBoost(
  items: Array<{ _id?: string; id?: string; image?: string; style?: string; primaryColor?: string; color?: string; colors?: string[]; category?: string; season?: string; favorite?: boolean; isFavorite?: boolean; wearCount?: number; usageCount?: number; itemPreferenceScore?: number }>,
  profile: UserPreferenceProfile = emptyPreferenceProfile,
  occasion?: string
) {
  let boost = 0
  const styles = items.map((item) => String(item.style || '').toLowerCase())
  const colors = items.flatMap((item) => [item.primaryColor || item.color || '', ...(item.colors || [])]).map((color) => color.toLowerCase())
  const categories = items.map((item) => String(item.category || '').toLowerCase())
  const seasons = items.map((item) => String(item.season || '').toLowerCase())
  const ids = items.map(itemId)

  boost += styles.filter((style) => profile.favoriteStyles.includes(style)).length * 3
  boost += styles.filter((style) => profile.preferredStyles.includes(style)).length * 3
  boost += colors.filter((color) => profile.favoriteColors.includes(color)).length * 2
  boost += colors.filter((color) => profile.preferredColors.includes(color)).length * 2
  boost += categories.filter((category) => profile.favoriteCategories.includes(category)).length * 2
  boost += seasons.filter((season) => profile.favoriteSeasons.includes(season)).length * 2
  boost += ids.filter((id) => profile.favoriteItems.includes(id)).length * 4
  boost += items.filter((item) => item.favorite || item.isFavorite).length * 2
  boost += Math.max(-12, Math.min(12, items.reduce((sum, item) => sum + Number(item.itemPreferenceScore || 0), 0) / Math.max(1, items.length)))
  if (occasion && profile.favoriteOccasions.includes(String(occasion).toLowerCase())) boost += 4
  boost -= colors.filter((color) => profile.avoidedColors.includes(color)).length * 8
  boost -= colors.filter((color) => profile.dislikedColors.includes(color)).length * 8
  boost -= styles.filter((style) => profile.dislikedStyles.includes(style)).length * 8
  boost -= categories.filter((category) => profile.dislikedCategories.includes(category)).length * 8
  boost -= seasons.filter((season) => profile.dislikedSeasons.includes(season)).length * 5
  boost -= ids.filter((id) => profile.rejectedItems.includes(id)).length * 10
  if (occasion && profile.dislikedOccasions.includes(String(occasion).toLowerCase())) boost -= 10

  return Math.max(-35, Math.min(35, boost))
}
