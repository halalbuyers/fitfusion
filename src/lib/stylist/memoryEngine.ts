import Clothing from '../../models/Clothing'
import OutfitInteraction from '../../models/OutfitInteraction'
import PersonalizationSignal from '../../models/PersonalizationSignal'
import { getPersonalizationProfile } from '../personalization-engine'
import type { StylistMemory } from './types'

function normalize(value?: string) {
  return String(value || '').trim().toLowerCase()
}

function topValues<T>(items: T[], getValue: (item: T) => string | undefined, weight: (item: T) => number = () => 1, limit = 6) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const value = normalize(getValue(item))
    if (!value || value === 'unknown') return acc
    acc[value] = (acc[value] || 0) + weight(item)
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value]) => value)
}

const memoryCache = new Map<string, { expires: number; memory: StylistMemory }>()

export async function getStylistMemory(userId: string): Promise<StylistMemory> {
  const cached = memoryCache.get(userId)
  if (cached && cached.expires > Date.now()) return cached.memory

  const [profile, wardrobe, interactions, stylistSignals] = await Promise.all([
    getPersonalizationProfile(userId),
    Clothing.find({ userId }).select('category primaryColor color colors style brand wearCount usageCount itemPreferenceScore').lean().catch(() => []),
    OutfitInteraction.find({ userId }).sort({ createdAt: -1 }).limit(80).lean().catch(() => []),
    PersonalizationSignal.find({ userId, preferenceType: 'stylist' }).lean().catch(() => [])
  ])

  const wearWeight = (item: any) => Math.max(1, Number(item.wearCount || item.usageCount || 0) + Number(item.itemPreferenceScore || 0) * 0.2)
  const favoriteBrands = topValues(wardrobe, (item: any) => item.brand, wearWeight, 5)
  const mostWornColors = topValues(wardrobe, (item: any) => item.primaryColor || item.color || item.colors?.[0], wearWeight, 5)
  const mostWornCategories = topValues(wardrobe, (item: any) => item.category, wearWeight, 5)
  const positiveStylist = stylistSignals.filter((signal: any) => Number(signal.score || 0) > 0).map((signal: any) => signal.value)
  const negativeStylist = stylistSignals.filter((signal: any) => Number(signal.score || 0) < 0).map((signal: any) => signal.value)
  const recentOutfitKeys = interactions.map((item: any) => item.outfitKey).filter(Boolean).slice(0, 20) as string[]
  const savedOutfitKeys = interactions.filter((item: any) => ['saved', 'favorited', 'liked', 'love_it', 'wear_again'].includes(String(item.action))).map((item: any) => item.outfitKey).filter(Boolean) as string[]
  const wornOutfitKeys = interactions.filter((item: any) => ['worn', 'wear_again'].includes(String(item.action))).map((item: any) => item.outfitKey).filter(Boolean) as string[]
  const preferredStyle = profile.favoriteStyles[0] || topValues(wardrobe, (item: any) => item.style, wearWeight, 1)[0] || 'modern casual'

  const memory: StylistMemory = {
    ...profile,
    favoriteBrands,
    weatherPreferences: positiveStylist.filter((value: string) => /(hot|cold|rain|winter|summer|weather)/.test(value)).slice(0, 4),
    occasionPreferences: [...new Set([...profile.favoriteOccasions, ...positiveStylist.filter((value: string) => /(office|college|party|travel|gym|wedding|casual)/.test(value))])].slice(0, 6),
    dislikedClothing: [...new Set([...profile.dislikedCategories, ...profile.dislikedColors, ...negativeStylist])].slice(0, 8),
    recentOutfitKeys,
    savedOutfitKeys,
    wornOutfitKeys,
    mostWornColors,
    mostWornCategories,
    preferredStyle,
    wardrobeSize: wardrobe.length
  }

  memoryCache.set(userId, { expires: Date.now() + 60000, memory })
  return memory
}

