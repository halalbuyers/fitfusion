import { buildWardrobeConsultantAnalysis } from '../analysis/analyticsEngine'
import type { StylistContextBundle } from './types'

export function generateWeeklyStyleReport(bundle: StylistContextBundle) {
  const analysis = buildWardrobeConsultantAnalysis(bundle.wardrobe as any[])
  return [
    `Your weekly style report: wardrobe health is ${analysis.wardrobeScore.score}/100 (${analysis.wardrobeScore.label}).`,
    `Most visible colors: ${analysis.colorAnalysis.distribution.slice(0, 3).map((entry: { color: string; percent: number }) => `${entry.color} ${entry.percent}%`).join(', ') || 'still learning'}.`,
    `Outfit potential: ${analysis.outfitPotential.possibleOutfits.toLocaleString()} combinations, rated ${analysis.outfitPotential.trend.toLowerCase()}.`,
    analysis.unusedItems.length ? `${analysis.unusedItems.length} pieces are underused; start with ${analysis.unusedItems[0].item.category}.` : 'Rotation looks healthy this week.',
    analysis.shoppingRecommendations[0] ? `Best wardrobe upgrade: ${analysis.shoppingRecommendations[0].title}, adding about ${analysis.shoppingRecommendations[0].estimatedNewCombinations} combinations.` : ''
  ].filter(Boolean).join(' ')
}
