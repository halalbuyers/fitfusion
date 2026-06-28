import { normalizeColor } from '../color-engine'
import { normalizeCategory, normalizeStyle } from '../fashion-analysis'
import type { AnalysisWardrobeItem } from './types'

export type DuplicateGroup = {
  key: string
  label: string
  count: number
  items: AnalysisWardrobeItem[]
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

export function detectDuplicates(items: AnalysisWardrobeItem[]): DuplicateGroup[] {
  const groups = items.reduce<Record<string, AnalysisWardrobeItem[]>>((acc, item) => {
    const key = [normalizeColor(item.primaryColor || item.color || item.colors?.[0]), normalizeCategory(item.category), normalizeStyle(item.style)].join(':')
    acc[key] = [...(acc[key] || []), item]
    return acc
  }, {})
  return Object.entries(groups)
    .filter(([, groupItems]) => groupItems.length >= 3)
    .map(([key, groupItems]) => {
      const [color, category, style] = key.split(':')
      const severity: DuplicateGroup['severity'] = groupItems.length >= 5 ? 'high' : groupItems.length >= 4 ? 'medium' : 'low'
      return {
        key,
        label: `${groupItems.length} ${color} ${style} ${category}`,
        count: groupItems.length,
        items: groupItems.slice(0, 8),
        severity,
        recommendation: severity === 'high' ? 'Keep the best two, then donate or sell the rest.' : 'Rotate these intentionally or reduce one duplicate.'
      }
    })
    .sort((a, b) => b.count - a.count)
}
