export type TryOnScores = {
  colorHarmony: number
  fitBalance: number
  layering: number
  seasonMatch: number
  occasionMatch: number
  weatherScore: number
  styleScore: number
  overallStyleScore: number
  label: string
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scoreTryOnLook(input: { outfit: any; settings: any; bodyConfidence?: number }): TryOnScores {
  const breakdown = input.outfit?.breakdown || {}
  const base = Number(input.outfit?.score || 74)
  const bodyConfidence = Number(input.bodyConfidence || 70)
  const colorHarmony = clamp(breakdown.colorScore ?? breakdown.aiColorHarmony ?? base)
  const fitBalance = clamp((breakdown.balanceScore ?? breakdown.aiLayeringQuality ?? base) * 0.75 + bodyConfidence * 0.25)
  const layering = clamp(breakdown.aiLayeringQuality ?? breakdown.balanceScore ?? base)
  const seasonMatch = clamp(breakdown.seasonScore ?? base)
  const occasionMatch = clamp(breakdown.occasionScore ?? base)
  const weatherScore = clamp(input.outfit?.weatherMatch?.score ?? breakdown.weatherScore ?? base)
  const styleBoost = String(input.settings?.styleVariation || '').includes(input.outfit?.tags?.[0]) ? 4 : 0
  const styleScore = clamp((colorHarmony + fitBalance + occasionMatch) / 3 + styleBoost)
  const overallStyleScore = clamp(colorHarmony * 0.18 + fitBalance * 0.2 + layering * 0.13 + seasonMatch * 0.12 + occasionMatch * 0.17 + weatherScore * 0.08 + styleScore * 0.12)
  const label = overallStyleScore >= 92 ? 'Excellent' : overallStyleScore >= 82 ? 'Strong' : overallStyleScore >= 70 ? 'Good' : 'Needs tuning'
  return { colorHarmony, fitBalance, layering, seasonMatch, occasionMatch, weatherScore, styleScore, overallStyleScore, label }
}

export function buildTryOnSuggestions(input: { outfit: any; scores: TryOnScores; settings: any }) {
  const suggestions: Array<{ id: string; label: string; reason: string; action: string }> = []
  if (input.scores.colorHarmony < 82) suggestions.push({ id: 'swap-shoes', label: 'Swap white sneakers for loafers', reason: 'A darker shoe can anchor the palette.', action: 'shoe-swap' })
  if (input.scores.layering < 78) suggestions.push({ id: 'remove-jacket', label: 'Remove jacket', reason: 'The outfit reads cleaner with fewer layers.', action: 'hide-layer' })
  if (input.scores.fitBalance < 80) suggestions.push({ id: 'black-trousers', label: 'Use black trousers', reason: 'A sharper lower half improves proportion.', action: 'bottom-swap' })
  if (/business|office|formal/.test(String(input.outfit?.occasion || input.settings?.occasion))) suggestions.push({ id: 'roll-sleeves', label: 'Roll sleeves', reason: 'It softens formal styling without losing polish.', action: 'sleeve-roll' })
  suggestions.push({ id: 'silver-watch', label: 'Add a silver watch', reason: 'A small accessory adds finish without visual noise.', action: 'add-accessory' })
  return suggestions.slice(0, 5)
}
