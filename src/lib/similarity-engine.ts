import { getPaletteCompatibilityScore } from './color-engine'
import { generateClothingEmbedding, type EmbeddableClothing } from './embedding-engine'
import { normalizeCategory, normalizeFit, normalizeStyle } from './fashion-analysis'

export type SimilarityItem = EmbeddableClothing & {
  _id?: string
  id?: string
  image?: string
  embedding?: number[]
  embeddingVersion?: number
}

export type SimilarityResult<T extends SimilarityItem = SimilarityItem> = {
  item: T
  score: number
  reason: string
}

export function cosineSimilarity(a: number[] = [], b: number[] = []) {
  const length = Math.min(a.length, b.length)
  if (!length) return 0
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function itemId(item: SimilarityItem) {
  return String(item._id || item.id || item.image || '')
}

function colors(item: SimilarityItem) {
  return [item.primaryColor, ...(item.secondaryColors || []), ...(item.colors || [])].filter(Boolean) as string[]
}

function metadataBoost(source: SimilarityItem, candidate: SimilarityItem) {
  let boost = 0
  if (normalizeStyle(source.style) === normalizeStyle(candidate.style)) boost += 8
  if (normalizeFit(source.fit || source.fitType) === normalizeFit(candidate.fit || candidate.fitType)) boost += 4
  if (normalizeCategory(source.category) === normalizeCategory(candidate.category)) boost += 5
  boost += (getPaletteCompatibilityScore([...colors(source), ...colors(candidate)]) - 60) * 0.18
  return boost
}

function reasonFor(source: SimilarityItem, candidate: SimilarityItem) {
  const sameStyle = normalizeStyle(source.style) === normalizeStyle(candidate.style)
  const sameFit = normalizeFit(source.fit || source.fitType) === normalizeFit(candidate.fit || candidate.fitType)
  if (sameStyle && sameFit) return 'Similar aesthetic and silhouette.'
  if (sameStyle) return 'Similar aesthetic direction.'
  if (sameFit) return 'Similar silhouette and proportions.'
  return 'Strong visual and palette similarity.'
}

export function findSimilarItems<T extends SimilarityItem>(item: SimilarityItem, wardrobe: T[], limit = 8): SimilarityResult<T>[] {
  const sourceEmbedding = item.embedding?.length ? item.embedding : generateClothingEmbedding(item)

  return wardrobe
    .filter((candidate) => itemId(candidate) && itemId(candidate) !== itemId(item))
    .map((candidate) => {
      const candidateEmbedding = candidate.embedding?.length ? candidate.embedding : generateClothingEmbedding(candidate)
      const visualScore = cosineSimilarity(sourceEmbedding, candidateEmbedding) * 100
      const score = Math.max(0, Math.min(100, Math.round(visualScore * 0.78 + metadataBoost(item, candidate))))
      return { item: candidate, score, reason: reasonFor(item, candidate) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function groupByMatchRole<T extends SimilarityItem>(source: SimilarityItem, wardrobe: T[]) {
  const similar = findSimilarItems(source, wardrobe, wardrobe.length)
  return {
    tops: similar.filter(({ item }) => ['tshirt', 'shirt', 'hoodie'].includes(normalizeCategory(item.category))).slice(0, 6),
    bottoms: similar.filter(({ item }) => ['jeans', 'cargo', 'shorts'].includes(normalizeCategory(item.category))).slice(0, 6),
    shoes: similar.filter(({ item }) => ['sneakers', 'boots'].includes(normalizeCategory(item.category))).slice(0, 6),
    layers: similar.filter(({ item }) => normalizeCategory(item.category) === 'jacket').slice(0, 6),
    accessories: similar.filter(({ item }) => normalizeCategory(item.category) === 'accessories').slice(0, 6)
  }
}

