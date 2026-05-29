import { normalizeColor } from './color-engine'
import { normalizeCategory, normalizeFit, normalizeSeason, normalizeStyle } from './fashion-analysis'

export const EMBEDDING_VERSION = 1

const colorAxis = ['black', 'white', 'gray', 'navy', 'blue', 'brown', 'beige', 'green', 'olive', 'red', 'pink', 'yellow', 'orange', 'purple', 'metallic']
const styleAxis = ['streetwear', 'casual', 'formal', 'minimal', 'vintage', 'sporty', 'techwear', 'old-money', 'y2k']
const categoryAxis = ['tshirt', 'shirt', 'hoodie', 'jacket', 'jeans', 'cargo', 'shorts', 'sneakers', 'boots', 'accessories', 'unknown']
const seasonAxis = ['summer', 'winter', 'spring', 'autumn', 'all-season']
const fitAxis = ['oversized', 'slim', 'regular', 'baggy']

export type EmbeddableClothing = {
  category?: string
  primaryColor?: string
  secondaryColors?: string[]
  colors?: string[]
  style?: string
  season?: string
  fit?: string
  fitType?: string
  formalityScore?: number
  warmthScore?: number
  tags?: string[]
}

function oneHot(axis: string[], value?: string, weight = 1) {
  return axis.map((entry) => entry === value ? weight : 0)
}

function colorVector(item: EmbeddableClothing) {
  const colors = [item.primaryColor, ...(item.secondaryColors || []), ...(item.colors || [])]
    .map((color) => normalizeColor(color))
    .filter((color) => color !== 'unknown')
  const unique = [...new Set(colors)]
  return colorAxis.map((color) => {
    const index = unique.indexOf(color)
    if (index === -1) return 0
    return index === 0 ? 1 : 0.55
  })
}

function tagTextureVector(tags: string[] = []) {
  const text = tags.join(' ').toLowerCase()
  return [
    text.includes('denim') ? 1 : 0,
    text.includes('leather') || text.includes('suede') ? 1 : 0,
    text.includes('fleece') || text.includes('wool') ? 1 : 0,
    text.includes('linen') || text.includes('cotton') ? 1 : 0
  ]
}

function normalizeVector(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0))
  if (!magnitude) return values
  return values.map((value) => Number((value / magnitude).toFixed(6)))
}

export function generateClothingEmbedding(item: EmbeddableClothing) {
  const category = normalizeCategory(item.category)
  const style = normalizeStyle(item.style)
  const season = normalizeSeason(item.season)
  const fit = normalizeFit(item.fit || item.fitType)

  const raw = [
    ...colorVector(item),
    ...oneHot(styleAxis, style, 1.1),
    ...oneHot(categoryAxis, category, 1.15),
    ...oneHot(seasonAxis, season, 0.75),
    ...oneHot(fitAxis, fit, 0.65),
    Number(item.formalityScore || 45) / 100,
    Number(item.warmthScore || 45) / 100,
    ...tagTextureVector(item.tags)
  ]

  return normalizeVector(raw)
}

export function needsEmbedding(item: { embedding?: number[]; embeddingVersion?: number }) {
  return !Array.isArray(item.embedding) || item.embedding.length === 0 || item.embeddingVersion !== EMBEDDING_VERSION
}

