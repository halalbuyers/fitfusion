import { analyzeClothingText, normalizeCategory, normalizeFit } from '../fashion-analysis'

export type ClothingDetection = {
  category: string
  gender: 'menswear' | 'womenswear' | 'unisex'
  sleeveLength: 'sleeveless' | 'short' | 'long' | 'not-applicable'
  neckType: 'crew' | 'v-neck' | 'collar' | 'hooded' | 'square' | 'unknown'
  fit: 'slim' | 'regular' | 'oversized' | 'baggy'
  pattern: 'solid' | 'striped' | 'graphic' | 'checked' | 'printed'
  material?: string
  confidence: number
}

function textIncludes(text: string, values: string[]) {
  return values.some((value) => text.includes(value))
}

export function detectClothingAttributes(input: { filename?: string; manualText?: string; ai?: any }): ClothingDetection {
  const text = [
    input.filename,
    input.manualText,
    input.ai?.category,
    input.ai?.style,
    input.ai?.fit,
    input.ai?.fitType,
    input.ai?.material,
    ...(input.ai?.tags || [])
  ].filter(Boolean).join(' ').toLowerCase()
  const fallback = analyzeClothingText(text)
  const category = normalizeCategory(input.ai?.category || fallback.category)
  const fit = normalizeFit(input.ai?.fit || input.ai?.fitType || fallback.fit)
  const gender = textIncludes(text, ['dress', 'skirt', 'blouse', 'saree', 'kurti', 'heels']) ? 'womenswear' : 'unisex'
  const sleeveLength = textIncludes(text, ['sleeveless', 'tank', 'camisole'])
    ? 'sleeveless'
    : textIncludes(text, ['long sleeve', 'hoodie', 'sweater', 'jacket', 'coat'])
      ? 'long'
      : ['tshirt', 'shirt', 'blouse'].includes(category)
        ? 'short'
        : 'not-applicable'
  const neckType = textIncludes(text, ['hoodie', 'hooded'])
    ? 'hooded'
    : textIncludes(text, ['v-neck', 'v neck'])
      ? 'v-neck'
      : textIncludes(text, ['collar', 'polo', 'oxford', 'button'])
        ? 'collar'
        : textIncludes(text, ['square neck'])
          ? 'square'
          : ['tshirt', 'hoodie'].includes(category) ? 'crew' : 'unknown'
  const pattern = textIncludes(text, ['stripe', 'striped'])
    ? 'striped'
    : textIncludes(text, ['check', 'checked', 'plaid'])
      ? 'checked'
      : textIncludes(text, ['graphic', 'logo'])
        ? 'graphic'
        : textIncludes(text, ['print', 'printed'])
          ? 'printed'
          : 'solid'
  const confidence = Math.max(45, Math.min(98, Number(input.ai?.category && input.ai?.style ? 84 : 68) + (category !== 'unknown' ? 8 : -16)))
  return { category, gender, sleeveLength, neckType, fit, pattern, material: input.ai?.material || fallback.material, confidence }
}

