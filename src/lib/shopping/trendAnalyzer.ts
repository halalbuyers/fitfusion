import type { ShoppingWardrobeItem, TrendSignal } from './types'
import { matchWardrobeForProduct } from './wardrobeMath'

const trendInputs = [
  { id: 'trend-butter-yellow', label: 'Butter Yellow', type: 'color' as const, category: 'shirt', color: 'yellow', momentum: 86 },
  { id: 'trend-relaxed-trousers', label: 'Relaxed Trousers', type: 'silhouette' as const, category: 'chinos', color: 'beige', momentum: 81 },
  { id: 'trend-slim-sneakers', label: 'Slim Retro Sneakers', type: 'sneaker' as const, category: 'sneakers', color: 'white', momentum: 88 },
  { id: 'trend-utility-jackets', label: 'Utility Jackets', type: 'jacket' as const, category: 'jacket', color: 'olive', momentum: 79 },
  { id: 'trend-cropped-overshirts', label: 'Boxy Overshirts', type: 'silhouette' as const, category: 'overshirt', color: 'beige', momentum: 76 }
]

export function analyzeTrends(wardrobe: ShoppingWardrobeItem[]): TrendSignal[] {
  return trendInputs.map((trend) => {
    const matches = matchWardrobeForProduct(wardrobe, trend, 5)
    const fitWithWardrobe = Math.min(100, Math.round(matches.length * 13 + trend.momentum * 0.38))
    return {
      id: trend.id,
      label: trend.label,
      type: trend.type,
      momentum: trend.momentum,
      fitWithWardrobe,
      matchingOwnedItems: matches,
      recommendation: matches.length >= 4
        ? `${trend.label} fits your existing wardrobe well. Treat it as a trend-safe buy.`
        : `${trend.label} is trending, but it needs more supporting basics in your wardrobe.`
    }
  }).sort((a, b) => b.fitWithWardrobe - a.fitWithWardrobe)
}

