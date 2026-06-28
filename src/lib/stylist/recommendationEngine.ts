import { normalizeCategory } from '../fashion-analysis'
import { generateOutfits, type GeneratedOutfit, type WardrobeEngineItem } from '../outfit-engine'
import { detectMissingEssentials } from '../ai/recommendationEngine'
import type { StylistContextBundle } from './types'

function itemId(item: WardrobeEngineItem) {
  return String(item._id || item.id || item.image || '')
}

function colors(items: WardrobeEngineItem[]) {
  return [...new Set(items.flatMap((item) => [item.primaryColor || item.color, ...(item.colors || []), ...(item.secondaryColors || [])]).filter(Boolean).map(String))]
}

function applyRefinement(wardrobe: WardrobeEngineItem[], bundle: StylistContextBundle) {
  const refinement = bundle.conversation.refinement
  let pool = wardrobe
  if (refinement?.removeLayer) pool = pool.filter((item) => !['jacket', 'hoodie'].includes(normalizeCategory(item.category)))
  if (refinement?.color) pool = pool.filter((item) => [item.primaryColor, item.color, ...(item.colors || [])].map((value) => String(value).toLowerCase()).includes(refinement.color!) || Math.random() > 0.55)
  if (refinement?.oversized) pool = pool.map((item) => ({
    ...item,
    itemPreferenceScore: Number(item.itemPreferenceScore || 0) + (String(item.fit || item.fitType || '').toLowerCase().includes('oversized') ? 8 : 0)
  }))
  return pool.length >= 3 ? pool : wardrobe
}

export function recommendFromWardrobe(bundle: StylistContextBundle): GeneratedOutfit | null {
  const refinedWardrobe = applyRefinement(bundle.wardrobe, bundle)
  const outfits = generateOutfits(refinedWardrobe, {
    occasion: bundle.conversation.refinement?.moreFormal ? 'office' : bundle.conversation.occasion,
    weather: bundle.weather?.condition,
    temperature: bundle.weather?.temperature,
    stylePreference: bundle.conversation.styleGoal || bundle.memory.preferredStyle,
    recentlyGenerated: bundle.memory.recentOutfitKeys,
    previousOutfitKeys: bundle.memory.recentOutfitKeys,
    itemUsageCount: bundle.wardrobe.reduce<Record<string, number>>((acc, item) => {
      acc[itemId(item)] = Number(item.usageCount || item.wearCount || 0)
      return acc
    }, {}),
    limit: 4
  })
  return outfits[0] || null
}

export function wardrobeRealityCheck(bundle: StylistContextBundle) {
  const missing = detectMissingEssentials(bundle.wardrobe).slice(0, 3)
  const hasShoes = bundle.wardrobe.some((item) => ['sneakers', 'boots', 'heels'].includes(normalizeCategory(item.category)))
  const hasBottom = bundle.wardrobe.some((item) => ['jeans', 'cargo', 'shorts', 'skirt'].includes(normalizeCategory(item.category)))
  const hasTop = bundle.wardrobe.some((item) => ['tshirt', 'shirt', 'hoodie', 'blouse', 'dress'].includes(normalizeCategory(item.category)))
  return { missing, completeBase: hasShoes && hasBottom && hasTop }
}

export function outfitSummary(outfit: GeneratedOutfit) {
  const outfitColors = colors(outfit.items)
  return {
    colors: outfitColors,
    hasLayer: outfit.items.some((item) => ['jacket', 'hoodie'].includes(normalizeCategory(item.category))),
    itemNames: outfit.items.map((item) => `${item.primaryColor || item.color || ''} ${item.category}`.trim())
  }
}

