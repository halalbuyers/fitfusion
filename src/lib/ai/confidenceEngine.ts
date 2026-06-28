type ConfidenceItem = {
  category?: string
  primaryColor?: string
  color?: string
  colors?: string[]
  style?: string
  season?: string
}

export function confidenceLabel(score: number) {
  if (score >= 90) return 'Very Confident'
  if (score >= 76) return 'Confident'
  if (score >= 60) return 'Limited wardrobe detected'
  return 'Low confidence'
}

export function scoreOutfitConfidence(items: ConfidenceItem[], wardrobe: ConfidenceItem[] = [], combinationCount = 0, outfitScore = 0) {
  const wardrobeSize = wardrobe.length
  const categories = new Set(wardrobe.map((item) => item.category).filter(Boolean))
  const colors = new Set(wardrobe.flatMap((item) => [item.primaryColor || item.color, ...(item.colors || [])]).filter(Boolean))
  const metadata = items.reduce((sum, item) => {
    let value = 25
    if (item.category) value += 20
    if (item.primaryColor || item.color || item.colors?.length) value += 20
    if (item.style) value += 14
    if (item.season) value += 8
    return sum + Math.min(100, value)
  }, 0) / Math.max(1, items.length)
  const wardrobeDepth = Math.min(100, wardrobeSize * 3 + categories.size * 6 + colors.size * 3 + Math.min(30, combinationCount / 10))
  const score = Math.max(0, Math.min(100, Math.round(metadata * 0.35 + wardrobeDepth * 0.25 + outfitScore * 0.4)))
  return { score, label: confidenceLabel(score) }
}

