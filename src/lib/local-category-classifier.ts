import { analyzeClothingText, detectCategoryFromFilename, normalizeCategory, type ClothingCategory } from './fashion-analysis'

export type CategoryClassification = {
  category: ClothingCategory
  confidence: number
  source: 'manual' | 'rules' | 'filename' | 'unknown'
}

export async function classifyClothingCategory(input: {
  manualCategory?: string
  filename?: string
  text?: string
  aiCategory?: string
}): Promise<CategoryClassification> {
  if (input.manualCategory) {
    return {
      category: normalizeCategory(input.manualCategory),
      confidence: 1,
      source: 'manual'
    }
  }

  const ruleCategory = analyzeClothingText(input.text || '').category
  if (ruleCategory !== 'unknown' && ruleCategory !== 'accessories') {
    return {
      category: ruleCategory,
      confidence: 0.72,
      source: 'rules'
    }
  }

  const aiCategory = normalizeCategory(input.aiCategory)
  if (aiCategory !== 'unknown' && aiCategory !== 'accessories') {
    return {
      category: aiCategory,
      confidence: 0.65,
      source: 'rules'
    }
  }

  const filenameCategory = detectCategoryFromFilename(input.filename || '')
  if (filenameCategory !== 'unknown') {
    return {
      category: filenameCategory,
      confidence: 0.58,
      source: 'filename'
    }
  }

  return {
    category: 'unknown',
    confidence: 0,
    source: 'unknown'
  }
}

