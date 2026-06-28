import Clothing from '../models/Clothing'
import Outfit from '../models/Outfit'
import UserPreference from '../models/UserPreference'
import FashionProfile from '../models/FashionProfile'
import { connectToDatabase } from '../lib/mongodb'
import { normalizeCategory } from '../lib/fashion-analysis'
import { buildPreferenceProfile } from '../lib/preference-engine'
import { getUserLearningMemory } from '../lib/learning-engine'
import { getPersonalizationProfile } from '../lib/personalization-engine'
import { generateOutfits, outfitColorSignature, outfitKey, outfitStructureKey, type OutfitRequest } from '../lib/outfit-engine'
import { generateGeminiText, hasGemini } from './gemini'
import { filterItemsByFashionProfile, getCategoriesForFashionType } from '../lib/outfit-engine-profile'
import type { MissingWardrobeEssential } from '../lib/ai/recommendationEngine'

export type GeneratedOutfit = {
  items: { id: string; role?: string }[]
  score: number
  explanation: string
  tags: string[]
  colorAnalysis?: string
  breakdown?: Record<string, number>
  outfitKey?: string
  confidence?: number
  confidenceLabel?: string
  weatherMatch?: { score: number; label: string; condition: string; reasons: string[]; prefer: string[]; avoid: string[] }
  missingEssentials?: MissingWardrobeEssential[]
  reasoning?: string[]
  method?: 'local' | 'hybrid'
}

function roleForCategory(category?: string) {
  const value = normalizeCategory(category)
  const text = String(category || '').toLowerCase()
  if (['shirt', 'tshirt', 'hoodie', 'blouse', 'dress', 'kurti', 'saree'].includes(value) || text.includes('shirt') || text.includes('tee')) return 'top'
  if (value === 'jacket' || text.includes('jacket') || text.includes('blazer') || text.includes('coat')) return 'layer'
  if (['jeans', 'cargo', 'shorts', 'skirt'].includes(value) || text.includes('trouser') || text.includes('pant') || text.includes('chino')) return 'bottom'
  if (['boots', 'sneakers', 'heels'].includes(value) || text.includes('shoe') || text.includes('loafer') || text.includes('sandal')) return 'shoes'
  return 'accessory'
}

function toApiOutfits(items: any[], request: OutfitRequest): GeneratedOutfit[] {
  return generateOutfits(items, request).map((outfit) => ({
    items: outfit.items.map((item: any) => ({ id: String(item._id || item.id), role: roleForCategory(item.category) })),
    score: outfit.score,
    explanation: outfit.explanation,
    tags: outfit.tags,
    colorAnalysis: outfit.colorAnalysis,
    breakdown: outfit.breakdown,
    outfitKey: outfit.outfitKey || outfitKey(outfit.items),
    confidence: outfit.confidence,
    confidenceLabel: outfit.confidenceLabel,
    weatherMatch: outfit.weatherMatch,
    missingEssentials: outfit.missingEssentials,
    reasoning: outfit.reasoning,
    method: 'local'
  }))
}

async function explainWithAi(outfits: GeneratedOutfit[], options: { occasion?: string; weather?: string; temperature?: number; season?: string; preferences?: string[] }) {
  if (!hasGemini() || !outfits.length) return outfits

  const candidates = outfits.slice(0, 5).map((outfit, idx) => ({
    candidateIndex: idx,
    score: outfit.score,
    tags: outfit.tags,
    colorAnalysis: outfit.colorAnalysis
  }))

  const prompt = `Rewrite explanations for these already-ranked outfit candidates. Do not change items or invent new outfits.
Context: occasion=${options.occasion || 'casual'}, weather=${options.weather || 'moderate'}, temperature=${options.temperature ?? 'unknown'}, season=${options.season || 'all-season'}, preferences=${(options.preferences || []).join(', ') || 'none'}
Candidates JSON: ${JSON.stringify(candidates)}
Return ONLY JSON: [{"candidateIndex":0,"explanation":"...","tags":["..."]}]`

  try {
    const raw = await generateGeminiText(prompt, 'You are a concise AI stylist. Explain why a scored outfit works; never generate new combinations.')
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return outfits
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return outfits
    const copy = [...outfits]
    for (const entry of parsed) {
      const candidate = copy[Number(entry.candidateIndex)]
      if (!candidate) continue
      candidate.explanation = String(entry.explanation || candidate.explanation)
      candidate.tags = Array.isArray(entry.tags) ? entry.tags.map(String) : candidate.tags
      candidate.method = 'hybrid'
    }
    return copy
  } catch {
    return outfits
  }
}

export async function generateOutfitsForUser(
  userId: string,
  options: {
    occasion?: string
    weather?: string
    temperature?: number
    season?: string
    preferences?: string[]
    mode?: 'basic' | 'hybrid'
    limit?: number
    rain?: boolean | number
    windKph?: number
    humidity?: number
    uvIndex?: number
    timeOfDay?: string
    boldFashion?: boolean
  } = {}
): Promise<GeneratedOutfit[]> {
  try {
    await connectToDatabase()
  } catch {
    return []
  }

  const [items, storedPreferences, memory, personalization] = await Promise.all([
    Clothing.find({ userId }).lean(),
    UserPreference.findOne({ userId }).lean().catch(() => null),
    getUserLearningMemory(userId),
    getPersonalizationProfile(userId)
  ])
  const fashionProfile = (await FashionProfile.findOne({ userId }).lean().catch(() => null)) as any
  if (!items.length) return []

  // Filter items based on fashion profile
  const filteredItems = filterItemsByFashionProfile(items, fashionProfile)
  console.log('OUTFIT GENERATION PROFILE:', { userId, fashionType: fashionProfile?.fashionType, totalItems: items.length, filteredItems: filteredItems.length })
  if (!filteredItems.length) {
    if (fashionProfile && fashionProfile.fashionType) {
      return []
    }
    return items.length ? toApiOutfits(items, { occasion: options.occasion || 'casual', limit: options.limit || 5 } as OutfitRequest) : []
  }

  const recentOutfits = await Outfit.find({ userId, outfitKey: { $exists: true, $ne: '' } })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('items.clothing')
    .select('outfitKey items')
    .lean()
    .catch(() => [])

  const profile = buildPreferenceProfile(items as any, storedPreferences || undefined)
  const itemUsageCount = recentOutfits.reduce<Record<string, number>>((acc, outfit: any) => {
    for (const entry of outfit.items || []) {
      const id = String(entry.clothing || '')
      if (id) acc[id] = (acc[id] || 0) + 1
    }
    return acc
  }, {})
  for (const item of items as any[]) {
    const id = String(item._id || item.id || '')
    if (!id) continue
    itemUsageCount[id] = Math.max(itemUsageCount[id] || 0, Number(item.usageCount || item.wearCount || 0))
  }
  const generationHistory = [...new Set([
    ...recentOutfits.map((outfit: any) => String(outfit.outfitKey)).filter(Boolean),
    ...memory.recentOutfitKeys
  ])]
  const recentItemCombos = recentOutfits.map((outfit: any) => (outfit.items || []).map((entry: any) => entry?.clothing).filter(Boolean))
  const recentStructures = [...new Set(recentItemCombos.map((combo: any[]) => combo.length ? outfitStructureKey(combo as any) : '').filter(Boolean))]
  const recentColorSignatures = [...new Set(recentItemCombos.map((combo: any[]) => combo.length ? outfitColorSignature(combo as any) : '').filter(Boolean))]
  const preferences = {
    ...profile,
    preferredStyles: [...new Set([...profile.preferredStyles, ...personalization.favoriteStyles])],
    preferredColors: [...new Set([...profile.preferredColors, ...personalization.favoriteColors])],
    favoriteCategories: [...new Set([...profile.favoriteCategories, ...personalization.favoriteCategories])],
    favoriteColors: [...new Set([...profile.favoriteColors, ...personalization.favoriteColors])],
    favoriteStyles: [...new Set([...profile.favoriteStyles, ...personalization.favoriteStyles])],
    favoriteSeasons: [...new Set([...profile.favoriteSeasons, ...personalization.favoriteSeasons])],
    favoriteOccasions: [...new Set([...profile.favoriteOccasions, ...personalization.favoriteOccasions])],
    dislikedColors: [...new Set([...profile.dislikedColors, ...personalization.dislikedColors])],
    dislikedStyles: [...new Set([...profile.dislikedStyles, ...personalization.dislikedStyles])],
    dislikedCategories: [...new Set([...profile.dislikedCategories, ...personalization.dislikedCategories])],
    dislikedSeasons: [...new Set([...profile.dislikedSeasons, ...personalization.dislikedSeasons])],
    dislikedOccasions: [...new Set([...profile.dislikedOccasions, ...personalization.dislikedOccasions])],
    avoidedColors: [...new Set([...profile.avoidedColors, ...personalization.dislikedColors])],
    rejectedOutfitKeys: [...new Set([...profile.rejectedOutfitKeys, ...memory.rejectedOutfitKeys])],
    likedOutfitKeys: [...new Set([...profile.likedOutfitKeys, ...memory.savedOutfitKeys])],
    favoriteOutfitKeys: [...new Set([...profile.favoriteOutfitKeys, ...memory.savedOutfitKeys])],
    favoriteItems: profile.favoriteItems,
    rejectedItems: profile.rejectedItems,
    overusedItems: profile.overusedItems
  }
  const request: OutfitRequest = {
    occasion: options.occasion || 'casual',
    weather: options.weather,
    temperature: options.temperature,
    season: options.season,
    rain: options.rain,
    windKph: options.windKph,
    humidity: options.humidity,
    uvIndex: options.uvIndex,
    timeOfDay: options.timeOfDay,
    boldFashion: options.boldFashion,
    stylePreference: options.preferences?.[0] || preferences.preferredStyles[0],
    preferences,
    recentlyGenerated: generationHistory.slice(0, 5),
    generationHistory,
    recentStructures,
    recentColorSignatures,
    itemUsageCount,
    rejectedOutfitKeys: preferences.rejectedOutfitKeys,
    previousOutfitKeys: generationHistory,
    limit: options.limit || 5
  }

  const localOutfits = toApiOutfits(filteredItems as any[], request)
  if (options.mode === 'hybrid') return explainWithAi(localOutfits, options)
  return localOutfits
}

export default generateOutfitsForUser
