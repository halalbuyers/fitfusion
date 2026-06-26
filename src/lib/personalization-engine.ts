import Clothing from '../models/Clothing'
import OutfitFeedback from '../models/OutfitFeedback'
import OutfitInteraction from '../models/OutfitInteraction'
import PersonalizationSignal, { type PreferenceType } from '../models/PersonalizationSignal'
import UserPreference from '../models/UserPreference'

const positiveWeight = {
  liked: 2,
  saved: 4,
  favorited: 5,
  worn: 6,
  rejected: -5,
  love_it: 5,
  not_my_style: -5,
  wear_again: 8,
  never_suggest_again: -10
} as const
const stylistWeight = { liked: 2, disliked: -2 } as const

export type PersonalizationProfile = {
  favoriteColors: string[]
  favoriteStyles: string[]
  favoriteCategories: string[]
  favoriteSeasons: string[]
  favoriteOccasions: string[]
  dislikedColors: string[]
  dislikedStyles: string[]
  dislikedCategories: string[]
  dislikedSeasons: string[]
  dislikedOccasions: string[]
}

export type AiStyleProfile = {
  personalizationScore: number
  message: string
  favoriteColors: string[]
  favoriteCategories: string[]
  favoriteStyles: string[]
  mostWornItems: Array<{ id: string; category: string; color: string; style: string; wearCount: number }>
  leastWornItems: Array<{ id: string; category: string; color: string; style: string; wearCount: number }>
  seasonPreference: string[]
  corrections: {
    categories: Array<{ predictedCategory: string; correctedCategory: string; count: number }>
    colors: Array<{ predictedColor: string; correctedColor: string; count: number }>
  }
}

function normalize(value?: string) {
  return String(value || '').trim().toLowerCase()
}

function clean(values: unknown[]) {
  return values.map((value) => normalize(String(value || ''))).filter((value): value is string => Boolean(value))
}

function unique(values: unknown[], limit = 8) {
  return [...new Set(clean(values))].slice(0, limit)
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function extractSignals(outfit: any) {
  const items = (outfit?.items || []).map((entry: any) => entry?.clothing || entry).filter(Boolean)
  return {
    color: [...new Set(clean(items.flatMap((item: any) => [item.primaryColor || item.color, ...(item.colors || [])])))],
    style: [...new Set(clean(items.map((item: any) => item.style)))],
    category: [...new Set(clean(items.map((item: any) => item.category)))],
    season: [...new Set(clean(items.map((item: any) => item.season)))],
    occasion: [normalize(outfit?.occasion)].filter(Boolean),
    structure: [[...new Set(items.map((item: any) => normalize(item.category)).filter(Boolean))].sort().join('+')].filter(Boolean)
  } satisfies Partial<Record<PreferenceType, string[]>>
}

export async function applyPersonalizationSignals(userId: string, outfit: any, action: keyof typeof positiveWeight) {
  const delta = positiveWeight[action]
  const signals = extractSignals(outfit)
  const updates: Promise<unknown>[] = []
  for (const [preferenceType, values] of Object.entries(signals) as Array<[PreferenceType, string[]]>) {
    for (const value of values) {
      updates.push(PersonalizationSignal.findOneAndUpdate(
        { userId, preferenceType, value },
        { $inc: { score: delta } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ))
    }
  }
  await Promise.all(updates)
}

export async function recordStylistAdviceFeedback(userId: string, action: keyof typeof stylistWeight, topic = 'advice') {
  const value = normalize(topic) || 'advice'
  await PersonalizationSignal.findOneAndUpdate(
    { userId, preferenceType: 'stylist', value },
    { $inc: { score: stylistWeight[action] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}

export async function getPersonalizationProfile(userId: string): Promise<PersonalizationProfile> {
  const rows = await PersonalizationSignal.find({ userId }).lean().catch(() => [])
  const top = (type: PreferenceType, min: number) => rows
    .filter((row) => row.preferenceType === type && Number(row.score) >= min)
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, 6)
    .map((row) => row.value)
  const bottom = (type: PreferenceType) => rows
    .filter((row) => row.preferenceType === type && Number(row.score) < 0)
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, 6)
    .map((row) => row.value)

  return {
    favoriteColors: top('color', 1),
    favoriteStyles: top('style', 1),
    favoriteCategories: top('category', 1),
    favoriteSeasons: top('season', 1),
    favoriteOccasions: top('occasion', 1),
    dislikedColors: bottom('color'),
    dislikedStyles: bottom('style'),
    dislikedCategories: bottom('category'),
    dislikedSeasons: bottom('season'),
    dislikedOccasions: bottom('occasion')
  }
}

export async function getPersonalizationScore(userId: string) {
  const [signals, interactions, feedbackCount, wardrobeCount, wornCount, correctedPreference] = await Promise.all([
    PersonalizationSignal.find({ userId }).lean().catch(() => []),
    OutfitInteraction.find({ userId }).lean().catch(() => []),
    OutfitFeedback.countDocuments({ userId }).catch(() => 0),
    Clothing.countDocuments({ userId }).catch(() => 0),
    Clothing.countDocuments({ userId, $or: [{ wearCount: { $gt: 0 } }, { usageCount: { $gt: 0 } }] }).catch(() => 0),
    UserPreference.findOne({ userId }).select('correctedCategories correctedColors likedOutfitKeys favoriteOutfitKeys rejectedOutfitKeys').lean().catch(() => null)
  ])

  const positiveSignals = signals.filter((row) => Number(row.score) > 0).length
  const negativeSignals = signals.filter((row) => Number(row.score) < 0).length
  const liked = interactions.filter((item) => ['liked', 'saved', 'favorited', 'love_it'].includes(String(item.action))).length
  const rejected = interactions.filter((item) => ['rejected', 'not_my_style', 'never_suggest_again'].includes(String(item.action))).length
  const worn = interactions.filter((item) => ['worn', 'wear_again'].includes(String(item.action))).length + wornCount
  const corrections =
    (correctedPreference?.correctedCategories || []).reduce((sum: number, item: any) => sum + Number(item.count || 1), 0) +
    (correctedPreference?.correctedColors || []).reduce((sum: number, item: any) => sum + Number(item.count || 1), 0)

  return clampScore(
    Math.min(24, wardrobeCount * 3) +
    Math.min(24, liked * 4 + Number(correctedPreference?.likedOutfitKeys?.length || 0)) +
    Math.min(16, rejected * 4 + Number(correctedPreference?.rejectedOutfitKeys?.length || 0)) +
    Math.min(16, corrections * 3) +
    Math.min(12, worn * 2) +
    Math.min(8, positiveSignals + negativeSignals) +
    Math.min(8, feedbackCount * 2)
  )
}

function itemSummary(item: any) {
  return {
    id: String(item._id || item.id || ''),
    category: String(item.category || 'unknown'),
    color: String(item.primaryColor || item.color || 'unknown'),
    style: String(item.style || 'casual'),
    wearCount: Number(item.wearCount || item.usageCount || 0)
  }
}

function topFromWardrobe(items: any[], key: 'category' | 'style' | 'season' | 'primaryColor') {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const value = normalize(key === 'primaryColor' ? item.primaryColor || item.color : item[key])
    if (!value || value === 'unknown') return acc
    const weight = Math.max(1, Number(item.wearCount || item.usageCount || 0) + Number(item.favorite || item.isFavorite || 0) * 2)
    acc[value] = (acc[value] || 0) + weight
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([value]) => value)
}

export async function getAiStyleProfile(userId: string): Promise<AiStyleProfile> {
  const [items, preference, profile, personalizationScore] = await Promise.all([
    Clothing.find({ userId }).lean().catch(() => []),
    UserPreference.findOne({ userId }).lean().catch(() => null),
    getPersonalizationProfile(userId),
    getPersonalizationScore(userId)
  ])

  const sortedByWear = [...items].sort((a: any, b: any) => Number(b.wearCount || b.usageCount || 0) - Number(a.wearCount || a.usageCount || 0))
  const leastWorn = [...items]
    .sort((a: any, b: any) => Number(a.wearCount || a.usageCount || 0) - Number(b.wearCount || b.usageCount || 0))
    .slice(0, 5)
    .map(itemSummary)

  const favoriteColors = unique([
    ...(profile.favoriteColors || []),
    ...(preference?.favoriteColors || []),
    ...(preference?.preferredColors || []),
    ...topFromWardrobe(items, 'primaryColor')
  ], 6)
  const favoriteCategories = unique([
    ...(profile.favoriteCategories || []),
    ...(preference?.favoriteCategories || []),
    ...topFromWardrobe(items, 'category')
  ], 6)
  const favoriteStyles = unique([
    ...(profile.favoriteStyles || []),
    ...(preference?.favoriteStyles || []),
    ...(preference?.preferredStyles || []),
    ...topFromWardrobe(items, 'style')
  ], 6)
  const seasonPreference = unique([
    ...(profile.favoriteSeasons || []),
    ...(preference?.favoriteSeasons || []),
    ...topFromWardrobe(items, 'season')
  ], 4)

  return {
    personalizationScore,
    message: `AI understands your style: ${personalizationScore}%`,
    favoriteColors,
    favoriteCategories,
    favoriteStyles,
    mostWornItems: sortedByWear.slice(0, 5).map(itemSummary),
    leastWornItems: leastWorn,
    seasonPreference,
    corrections: {
      categories: (preference?.correctedCategories || []).map((item: any) => ({
        predictedCategory: item.predictedCategory,
        correctedCategory: item.correctedCategory,
        count: Number(item.count || 1)
      })),
      colors: (preference?.correctedColors || []).map((item: any) => ({
        predictedColor: item.predictedColor,
        correctedColor: item.correctedColor,
        count: Number(item.count || 1)
      }))
    }
  }
}
