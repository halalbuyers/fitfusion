import { analyzeClothingText, mergeFashionAnalysis } from './fashion-analysis'
import { normalizeReviewCategory, normalizeReviewColor } from './review-options'
import { parseTags } from './api'

export type WardrobeConfirmationInput = {
  userId: string
  image: string
  category?: string
  primaryColor?: string
  color?: string
  secondaryColors?: string[] | string
  colors?: string[] | string
  style?: string
  season?: string
  tags?: string[] | string
  brand?: string
  fit?: string
  fitType?: string
  material?: string
  gender?: string
  sleeveLength?: string
  neckType?: string
  pattern?: string
  quality?: string
  thumbnail?: string
  blurDataUrl?: string
  visionConfidence?: number
  vision?: Record<string, any>
  occasion?: string[] | string
  aiCategory?: string
  aiColor?: string
  categoryConfidence?: number
  colorConfidence?: number
  correctedByUser?: boolean
}

function cleanNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0
}

function uniqueColors(values: string[]) {
  return [...new Set(values.map(normalizeReviewColor).filter((color) => color && color !== 'unknown'))]
}

export function buildConfirmedClothingPayload(input: WardrobeConfirmationInput) {
  const parsedTags = parseTags(input.tags)
  const parsedOccasion = parseTags(input.occasion)
  const parsedColors = parseTags(input.colors)
  const parsedSecondaryColors = parseTags(input.secondaryColors)
  const rawCategory = String(input.category || '').trim().toLowerCase()
  const category = normalizeReviewCategory(rawCategory)
  const resolvedCategory = category === 'other' && rawCategory ? rawCategory : category
  const primaryColor = normalizeReviewColor(input.primaryColor || input.color)
  const colors = parsedColors.length ? uniqueColors(parsedColors) : uniqueColors([primaryColor, ...parsedSecondaryColors])
  const secondaryColors = parsedSecondaryColors.length
    ? uniqueColors(parsedSecondaryColors).filter((color) => color !== primaryColor)
    : colors.slice(1)
  const fallback = analyzeClothingText(`${category} ${primaryColor} ${parsedTags.join(' ')} ${input.brand || ''} ${input.fit || input.fitType || ''} ${input.material || ''}`)
  const analysis = mergeFashionAnalysis(fallback, {
    category,
    primaryColor,
    secondaryColors,
    colors,
    style: input.style,
    season: input.season,
    fit: input.fit || input.fitType,
    fitType: input.fitType || input.fit,
    tags: parsedTags,
    occasion: parsedOccasion,
    material: input.material
  })
  const aiCategory = normalizeReviewCategory(input.aiCategory || category)
  const aiColor = normalizeReviewColor(input.aiColor || primaryColor)
  const finalColors = colors.length ? colors : uniqueColors(analysis.colors)
  const correctedByUser = Boolean(input.correctedByUser) || aiCategory !== resolvedCategory || aiColor !== primaryColor

  return {
    userId: input.userId,
    image: input.image,
    category: resolvedCategory,
    primaryColor,
    secondaryColors,
    color: primaryColor,
    colors: finalColors,
    style: input.style || analysis.style,
    season: input.season || analysis.season,
    occasion: parsedOccasion.length ? parsedOccasion : analysis.occasion,
    tags: parsedTags.length ? parsedTags : analysis.tags,
    brand: input.brand,
    fit: input.fit || input.fitType || analysis.fit,
    fitType: input.fitType || input.fit || analysis.fitType,
    formalityScore: analysis.formalityScore,
    warmthScore: analysis.warmthScore,
    material: input.material || analysis.material,
    gender: input.gender,
    sleeveLength: input.sleeveLength,
    neckType: input.neckType,
    pattern: input.pattern,
    quality: input.quality,
    thumbnail: input.thumbnail,
    blurDataUrl: input.blurDataUrl,
    visionConfidence: cleanNumber(input.visionConfidence),
    vision: input.vision,
    aiCategory,
    aiColor,
    categoryConfidence: cleanNumber(input.categoryConfidence),
    colorConfidence: cleanNumber(input.colorConfidence),
    correctedByUser
  }
}
