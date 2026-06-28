import { normalizeColor } from '../color-engine'
import type { AnalysisWardrobeItem } from './types'

export type WardrobeColorAnalysis = {
  distribution: Array<{ color: string; count: number; percent: number }>
  balanceScore: number
  dominantColor?: string
  imbalance: string[]
  suggestedColors: string[]
}

export function analyzeColorDistribution(items: AnalysisWardrobeItem[]): WardrobeColorAnalysis {
  const counts = new Map<string, number>()
  for (const item of items) {
    const color = normalizeColor(item.primaryColor || item.color || item.colors?.[0])
    counts.set(color, (counts.get(color) || 0) + 1)
  }
  const total = Math.max(1, items.length)
  const distribution = [...counts.entries()]
    .map(([color, count]) => ({ color: color === 'gray' ? 'grey' : color, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
  const dominant = distribution[0]
  const neutralPercent = distribution.filter((entry) => ['black', 'white', 'grey', 'gray', 'navy', 'beige', 'cream', 'brown'].includes(entry.color)).reduce((sum, entry) => sum + entry.percent, 0)
  const colorDiversity = distribution.filter((entry) => entry.color !== 'unknown').length
  const dominancePenalty = Math.max(0, (dominant?.percent || 0) - 32) * 1.2
  const unknownPenalty = (distribution.find((entry) => entry.color === 'unknown')?.percent || 0) * 0.45
  const balanceScore = Math.max(0, Math.min(100, Math.round(45 + Math.min(8, colorDiversity) * 7 + Math.min(30, neutralPercent * 0.25) - dominancePenalty - unknownPenalty)))
  const suggestedColors = ['white', 'grey', 'navy', 'beige', 'olive', 'brown'].filter((color) => !distribution.some((entry) => entry.color === color)).slice(0, 4)
  const imbalance = [
    dominant && dominant.percent >= 35 ? `Your wardrobe relies heavily on ${dominant.color} at ${dominant.percent}%.` : '',
    colorDiversity <= 3 && items.length >= 8 ? 'Color variety is narrow for the wardrobe size.' : '',
    neutralPercent < 45 && items.length >= 6 ? 'You may need more neutral anchors for easier outfit building.' : ''
  ].filter(Boolean)
  return { distribution, balanceScore, dominantColor: dominant?.color, imbalance, suggestedColors }
}

