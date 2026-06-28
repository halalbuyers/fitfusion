export function estimateQuality(input: { confidence: number; coverage?: number; warnings?: string[] }) {
  if ((input.warnings || []).length >= 2 || input.confidence < 58) return 'Needs Review'
  if (input.confidence >= 90 && Number(input.coverage || 0) >= 0.25) return 'Excellent'
  if (input.confidence >= 75) return 'Good'
  return 'Average'
}

export function generateSmartTags(input: {
  category?: string
  primaryColor?: string
  secondaryColors?: string[]
  style?: string
  season?: string
  occasion?: string[]
  fit?: string
  material?: string
  pattern?: string
  sleeveLength?: string
}) {
  return [...new Set([
    input.primaryColor,
    ...(input.secondaryColors || []),
    input.fit,
    input.material,
    input.pattern,
    input.sleeveLength,
    input.category,
    input.season,
    input.style,
    ...(input.occasion || [])
  ].filter((value) => value && value !== 'unknown' && value !== 'not-applicable').map((value) => String(value).toLowerCase()))]
}

export function confidenceLabel(score: number) {
  if (score >= 90) return 'Very Confident'
  if (score >= 75) return 'Confident'
  return 'Needs User Review'
}

