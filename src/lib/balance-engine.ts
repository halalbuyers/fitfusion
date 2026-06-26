import { getPaletteCompatibilityScore, normalizeColors } from './color-engine'
import { normalizeCategory, normalizeStyle } from './fashion-analysis'
import { itemKnowledge, itemKnowledgeKey } from './fashion-knowledge'

type BalanceItem = {
  category?: string
  primaryColor?: string
  color?: string
  secondaryColors?: string[]
  colors?: string[]
  style?: string
  fit?: string
  fitType?: string
  formalityScore?: number
  material?: string
  tags?: string[]
}

export type OutfitBalanceResult = {
  score: number
  colorBalance: number
  layerBalance: number
  silhouetteBalance: number
  formalityBalance: number
  valid: boolean
  conflicts: string[]
  reasons: string[]
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function balanceRole(item: BalanceItem) {
  const key = itemKnowledgeKey(item)
  const category = normalizeCategory(item.category)
  if (['tshirt', 'shirt', 'hoodie', 'blouse', 'dress', 'kurti', 'saree', 'polo', 'dress-shirt', 'oversized-tshirt', 'linen-shirt'].includes(key) || ['tshirt', 'shirt', 'hoodie', 'blouse', 'dress', 'kurti', 'saree'].includes(category)) return 'top'
  if (['jacket', 'blazer', 'coat', 'parka', 'puffer'].includes(key) || category === 'jacket') return 'layer'
  if (['jeans', 'cargo', 'shorts', 'skirt', 'chinos', 'trousers', 'gym-shorts'].includes(key) || ['jeans', 'cargo', 'shorts', 'skirt'].includes(category)) return 'bottom'
  if (['sneakers', 'boots', 'heels', 'loafers', 'oxford-shoes', 'slides', 'sandals'].includes(key) || ['sneakers', 'boots', 'heels'].includes(category)) return 'shoes'
  return 'accessory'
}

function itemColors(item: BalanceItem) {
  return normalizeColors([item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])].filter(Boolean) as string[])
}

function formality(item: BalanceItem) {
  return Number(item.formalityScore ?? itemKnowledge(item).formality)
}

function fitWeight(item: BalanceItem) {
  const text = [item.fit, item.fitType, ...(item.tags || [])].join(' ').toLowerCase()
  if (text.includes('oversized') || text.includes('baggy') || text.includes('wide')) return 2
  if (text.includes('slim') || text.includes('skinny')) return -1
  return 0
}

export function analyzeOutfitBalance(items: BalanceItem[]): OutfitBalanceResult {
  const roles = items.map(balanceRole)
  const keys = items.map(itemKnowledgeKey)
  const colors = [...new Set(items.flatMap(itemColors))]
  const layerCount = roles.filter((role) => role === 'layer').length
  const topCount = roles.filter((role) => role === 'top').length
  const hasTop = roles.includes('top')
  const hasBottom = roles.includes('bottom')
  const hasShoes = roles.includes('shoes')
  const conflicts: string[] = []

  if (keys.includes('hoodie') && keys.includes('jacket') && keys.includes('blazer')) conflicts.push('hoodie + jacket + blazer overbuilds the layers')
  if ((keys.includes('dress-shirt') || keys.includes('shirt')) && (keys.includes('gym-shorts') || keys.includes('shorts')) && keys.includes('slides')) conflicts.push('formal top with gym shorts or slides feels mismatched')
  if (keys.includes('blazer') && keys.includes('gym-shorts')) conflicts.push('blazer and gym shorts have incompatible formality')
  if (layerCount > 2) conflicts.push('too many outer layers')
  if (topCount > 2) conflicts.push('too many top layers')

  const paletteScore = colors.length ? getPaletteCompatibilityScore(colors) : 50
  const colorBalance = clamp(paletteScore - Math.max(0, colors.length - 4) * 7)

  let layerBalance = 72
  if (hasTop) layerBalance += 8
  if (layerCount === 1) layerBalance += 10
  if (layerCount > 1) layerBalance -= layerCount * 14
  if (roles.includes('layer') && !hasTop) layerBalance -= 24

  const topFit = items.filter((item) => balanceRole(item) === 'top').reduce((sum, item) => sum + fitWeight(item), 0)
  const bottomFit = items.filter((item) => balanceRole(item) === 'bottom').reduce((sum, item) => sum + fitWeight(item), 0)
  let silhouetteBalance = 72
  if (hasTop && hasBottom) silhouetteBalance += 12
  if (Math.abs(topFit + bottomFit) <= 2) silhouetteBalance += 8
  if (topFit >= 3 && bottomFit >= 2) silhouetteBalance -= 18
  if (topFit <= -1 && bottomFit <= -1) silhouetteBalance -= 10

  const formalities = items.map(formality)
  const formalitySpread = Math.max(...formalities, 45) - Math.min(...formalities, 45)
  const styles = [...new Set(items.map((item) => normalizeStyle(item.style)))]
  let formalityBalance = 90 - formalitySpread * 0.7
  if (styles.includes('formal') && styles.includes('sporty')) formalityBalance -= 24
  if (styles.includes('old-money') && styles.includes('techwear')) formalityBalance -= 14
  if (conflicts.length) formalityBalance -= conflicts.length * 12

  let structureBonus = 0
  if (hasTop) structureBonus += 4
  if (hasBottom) structureBonus += 4
  if (hasShoes) structureBonus += 4

  const score = clamp(
    colorBalance * 0.25 +
    clamp(layerBalance) * 0.22 +
    clamp(silhouetteBalance) * 0.25 +
    clamp(formalityBalance) * 0.28 +
    structureBonus
  )

  const reasons = [
    colorBalance >= 75 ? 'Palette is balanced.' : 'Palette needs calmer color distribution.',
    clamp(layerBalance) >= 75 ? 'Layering is clean.' : 'Layering needs restraint.',
    clamp(silhouetteBalance) >= 75 ? 'Silhouette is proportionate.' : 'Silhouette proportions could be stronger.',
    clamp(formalityBalance) >= 75 ? 'Formality levels align.' : 'Formality levels are mixed.'
  ]

  return {
    score,
    colorBalance,
    layerBalance: clamp(layerBalance),
    silhouetteBalance: clamp(silhouetteBalance),
    formalityBalance: clamp(formalityBalance),
    valid: conflicts.length === 0 && score >= 42,
    conflicts,
    reasons
  }
}
