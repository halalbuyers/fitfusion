export type { ClothingCategory, FashionAnalysis, FashionStyle, FitType, Season } from './fashion-analysis'
export type { GeneratedOutfit as GeneratedLocalOutfit, OutfitRequest, WardrobeEngineItem as WardrobeItem } from './outfit-engine'

export { analyzeClothingText as analyzeClothing, legacyCategory, mergeFashionAnalysis, normalizeCategory, normalizeFit, normalizeSeason, normalizeStyle } from './fashion-analysis'
export { getColorCompatibilityScore, getPaletteCompatibilityScore as colorScore, isLuxuryPalette, normalizeColor, normalizeColors } from './color-engine'
export { generateOutfits, scoreOutfit } from './outfit-engine'
import { getPaletteCompatibilityScore } from './color-engine'

export function compatibilityScore(items: Array<{ primaryColor?: string; color?: string; colors?: string[] }>) {
  return getPaletteCompatibilityScore(items.flatMap((item) => [item.primaryColor || item.color || '', ...(item.colors || [])]))
}
