import { isLuxuryPalette, isMonochromePalette } from './color-engine'
import { normalizeCategory, normalizeStyle } from './fashion-analysis'
import { findSimilarItems, type SimilarityItem } from './similarity-engine'

export type WardrobeAnalytics = {
  dominantStyle: string
  mostUsedColor: string
  leastUsedCategory: string
  wardrobeBalance: number
  underusedItems: SimilarityItem[]
  styleClusters: Array<{ name: string; count: number; items: SimilarityItem[] }>
  insights: string[]
}

const requiredCategories = ['tshirt', 'shirt', 'hoodie', 'jacket', 'jeans', 'cargo', 'shorts', 'sneakers', 'boots']
const clusterNames = ['streetwear', 'minimal', 'formal', 'vintage', 'sporty', 'monochrome', 'luxury']

function topValue(values: string[], fallback: string) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    if (!value || value === 'unknown') return acc
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback
}

function clusterFor(item: SimilarityItem) {
  const colors = [item.primaryColor, ...(item.colors || [])].filter(Boolean) as string[]
  const style = normalizeStyle(item.style)
  if (isMonochromePalette(colors)) return 'monochrome'
  if (isLuxuryPalette(colors) || style === 'old-money') return 'luxury'
  if (clusterNames.includes(style)) return style
  return 'minimal'
}

export function analyzeWardrobe(items: SimilarityItem[]): WardrobeAnalytics {
  const categories = items.map((item) => normalizeCategory(item.category))
  const colors = items.flatMap((item) => [item.primaryColor, ...(item.colors || [])]).filter(Boolean).map(String)
  const styles = items.map((item) => normalizeStyle(item.style))
  const categoryCounts = requiredCategories.map((category) => [category, categories.filter((entry) => entry === category).length] as const)
  const leastUsedCategory = categoryCounts.sort((a, b) => a[1] - b[1])[0]?.[0] || 'unknown'
  const coveredCategories = categoryCounts.filter(([, count]) => count > 0).length
  const styleDiversity = new Set(styles).size
  const colorDiversity = new Set(colors.filter((color) => color !== 'unknown')).size
  const wardrobeBalance = Math.max(0, Math.min(100, Math.round((coveredCategories / requiredCategories.length) * 55 + Math.min(styleDiversity, 5) * 6 + Math.min(colorDiversity, 6) * 2.5)))
  const underusedItems = [...items]
    .filter((item) => Number((item as any).wearCount || (item as any).usageCount || 0) === 0)
    .slice(0, 6)

  const clusterMap = items.reduce<Record<string, SimilarityItem[]>>((acc, item) => {
    const cluster = clusterFor(item)
    acc[cluster] = [...(acc[cluster] || []), item]
    return acc
  }, {})

  const styleClusters = Object.entries(clusterMap)
    .map(([name, clusterItems]) => ({ name, count: clusterItems.length, items: clusterItems.slice(0, 6) }))
    .sort((a, b) => b.count - a.count)

  const dominantStyle = topValue(styles, 'minimal')
  const mostUsedColor = topValue(colors, 'unknown')
  const insights = generateWardrobeInsights(items, { dominantStyle, mostUsedColor, leastUsedCategory, wardrobeBalance, underusedItems, styleClusters, insights: [] })

  return { dominantStyle, mostUsedColor, leastUsedCategory, wardrobeBalance, underusedItems, styleClusters, insights }
}

export function generateWardrobeInsights(items: SimilarityItem[], analytics = analyzeWardrobe(items)): string[] {
  const insights: string[] = []
  const categories = items.map((item) => normalizeCategory(item.category))
  const colors = items.flatMap((item) => [item.primaryColor, ...(item.colors || [])]).filter(Boolean).map(String)
  const summerCount = items.filter((item) => String(item.season || '').toLowerCase() === 'summer').length
  const formalCount = items.filter((item) => normalizeStyle(item.style) === 'formal' || Number(item.formalityScore || 0) >= 65).length
  const blackHoodies = items.filter((item) => normalizeCategory(item.category) === 'hoodie' && colors.includes('black')).length

  if (!categories.includes('jeans') && !categories.includes('cargo')) insights.push('You need more neutral pants to unlock stronger everyday outfit combinations.')
  if (formalCount < 2) insights.push('You rarely wear or own formal pieces; add one sharp shirt or jacket for date and formal outfits.')
  if (summerCount < Math.max(2, items.length * 0.12)) insights.push('Your wardrobe lacks summer-ready clothing, especially breathable tops or shorts.')
  if (blackHoodies >= 3) insights.push('You overuse black hoodies; try adding a lighter layer to expand your outfit range.')
  if (analytics.wardrobeBalance < 55) insights.push(`Your wardrobe balance is ${analytics.wardrobeBalance}; filling the ${analytics.leastUsedCategory} gap would improve recommendations.`)
  if (analytics.underusedItems.length >= 3) insights.push(`${analytics.underusedItems.length} pieces are underused and could be rotated into fresh outfits.`)
  if (!insights.length) insights.push('Your wardrobe has a healthy mix of colors, styles, and categories. Keep saving favorites to sharpen recommendations.')

  return insights.slice(0, 5)
}

export function buildDiscoveryFeed(items: SimilarityItem[]) {
  const analytics = analyzeWardrobe(items)
  const anchors = items.slice(0, 8)
  return anchors.flatMap((anchor) => {
    const similar = findSimilarItems(anchor, items, 3)
    return similar.map((entry) => ({
      type: 'similar-vibe',
      title: `Similar vibe to ${anchor.category || 'this item'}`,
      anchor,
      item: entry.item,
      score: entry.score,
      reason: entry.reason
    }))
  }).slice(0, 18).concat(
    analytics.styleClusters.slice(0, 4).map((cluster) => ({
      type: 'complete-aesthetic',
      title: `Complete this ${cluster.name} aesthetic`,
      anchor: cluster.items[0],
      item: cluster.items[1] || cluster.items[0],
      score: Math.min(98, 70 + cluster.count * 4),
      reason: `${cluster.count} wardrobe pieces already share this visual language.`
    }))
  )
}

