import { normalizeCategory } from './fashion-analysis'

type GapItem = { title: string; reason: string; priority: 'high' | 'medium' | 'low' }

export function analyzeWardrobeGaps(wardrobe: Array<{ category?: string; primaryColor?: string; color?: string; season?: string; style?: string }>): GapItem[] {
  const categories = wardrobe.map((item) => normalizeCategory(item.category))
  const colors = wardrobe.map((item) => String(item.primaryColor || item.color || '').toLowerCase())
  const seasons = wardrobe.map((item) => String(item.season || '').toLowerCase())
  const count = (value: string) => categories.filter((category) => category === value).length
  const colorCount = (value: string) => colors.filter((color) => color === value).length
  const gaps: GapItem[] = []

  if (!colors.includes('white') || !categories.includes('sneakers')) gaps.push({ title: 'White sneakers', reason: 'They unlock clean casual, college, date, and travel outfits.', priority: 'high' })
  if (!categories.includes('boots')) gaps.push({ title: 'Formal shoes or boots', reason: 'You need one sharper footwear option for formal and date outfits.', priority: 'medium' })
  if (colorCount('black') > Math.max(3, wardrobe.length * 0.45)) gaps.push({ title: 'More non-black pieces', reason: 'Your closet leans heavily black, so lighter neutrals would improve variety.', priority: 'medium' })
  if (!seasons.includes('summer') && !categories.includes('shorts')) gaps.push({ title: 'Summer tops or shorts', reason: 'Warm-weather recommendations need lighter pieces.', priority: 'medium' })
  if (!categories.includes('jacket') && !categories.includes('hoodie')) gaps.push({ title: 'Layering piece', reason: 'A jacket or hoodie adds weather flexibility and stronger silhouettes.', priority: 'high' })
  if (count('tshirt') + count('shirt') < 2) gaps.push({ title: 'Everyday tops', reason: 'More tops create the biggest increase in outfit combinations.', priority: 'high' })

  return gaps.slice(0, 6)
}
