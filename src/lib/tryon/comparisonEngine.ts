export function compareTryOnLooks(looks: Array<{ _id?: string; title?: string; scores?: any; outfitSnapshot?: any }>) {
  const ranked = [...looks].sort((a, b) => Number(b.scores?.overallStyleScore || 0) - Number(a.scores?.overallStyleScore || 0))
  const winner = ranked[0]
  if (!winner) return { winnerId: '', summary: 'Generate looks to compare styling quality.', reasons: [] as string[] }
  const runnerUp = ranked[1]
  const reasons = [
    `${winner.title || 'The leading look'} has the strongest overall style score.`,
    `Color harmony is ${Math.round(Number(winner.scores?.colorHarmony || 0))}/100 and fit balance is ${Math.round(Number(winner.scores?.fitBalance || 0))}/100.`
  ]
  if (runnerUp) reasons.push(`It edges out ${runnerUp.title || 'the next look'} by ${Math.round(Number(winner.scores?.overallStyleScore || 0) - Number(runnerUp.scores?.overallStyleScore || 0))} points.`)
  return {
    winnerId: String(winner._id || ''),
    summary: `${winner.title || 'The leading look'} works best because it balances color, fit, occasion, and weather more cleanly.`,
    reasons
  }
}
