export type UserPreferenceProfile = {
  preferredStyles: string[]
  preferredColors: string[]
  avoidedColors: string[]
  favoriteCategories: string[]
  rejectedOutfitKeys: string[]
  favoriteOutfitKeys: string[]
}

export const emptyPreferenceProfile: UserPreferenceProfile = {
  preferredStyles: [],
  preferredColors: [],
  avoidedColors: [],
  favoriteCategories: [],
  rejectedOutfitKeys: [],
  favoriteOutfitKeys: []
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

export function buildPreferenceProfile(items: Array<{ style?: string; primaryColor?: string; color?: string; colors?: string[]; category?: string; favorite?: boolean; isFavorite?: boolean; wearCount?: number; usageCount?: number }>, stored?: Partial<UserPreferenceProfile>): UserPreferenceProfile {
  const favoriteItems = items.filter((item) => item.favorite || item.isFavorite || Number(item.wearCount || item.usageCount || 0) > 1)
  const source = favoriteItems.length ? favoriteItems : items
  const preferredStyles = topValues([...source.map((item) => item.style || ''), ...(stored?.preferredStyles || [])])
  const preferredColors = topValues([...source.flatMap((item) => [item.primaryColor || item.color || '', ...(item.colors || [])]), ...(stored?.preferredColors || [])])
  const favoriteCategories = topValues([...source.map((item) => item.category || ''), ...(stored?.favoriteCategories || [])])

  return {
    preferredStyles,
    preferredColors,
    avoidedColors: [...new Set((stored?.avoidedColors || []).map((color) => color.toLowerCase()))],
    favoriteCategories,
    rejectedOutfitKeys: [...new Set((stored?.rejectedOutfitKeys || []).map(String))],
    favoriteOutfitKeys: [...new Set((stored?.favoriteOutfitKeys || []).map(String))]
  }
}

export function preferenceBoost(items: Array<{ style?: string; primaryColor?: string; color?: string; colors?: string[]; category?: string; favorite?: boolean; isFavorite?: boolean; wearCount?: number; usageCount?: number }>, profile: UserPreferenceProfile = emptyPreferenceProfile) {
  let boost = 0
  const styles = items.map((item) => String(item.style || '').toLowerCase())
  const colors = items.flatMap((item) => [item.primaryColor || item.color || '', ...(item.colors || [])]).map((color) => color.toLowerCase())
  const categories = items.map((item) => String(item.category || '').toLowerCase())

  boost += styles.filter((style) => profile.preferredStyles.includes(style)).length * 3
  boost += colors.filter((color) => profile.preferredColors.includes(color)).length * 2
  boost += categories.filter((category) => profile.favoriteCategories.includes(category)).length * 2
  boost += items.filter((item) => item.favorite || item.isFavorite).length * 2
  boost -= colors.filter((color) => profile.avoidedColors.includes(color)).length * 8

  return Math.max(-20, Math.min(20, boost))
}
