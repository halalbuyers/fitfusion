import { normalizeStyle } from './fashion-analysis'
import { itemKnowledge, itemKnowledgeKey, normalizeOccasion, occasionRelationships, type FashionOccasion } from './fashion-knowledge'

type OccasionItem = {
  category?: string
  style?: string
  fit?: string
  fitType?: string
  material?: string
  tags?: string[]
  formalityScore?: number
}

export type OccasionScore = {
  occasion: FashionOccasion
  score: number
  matched: string[]
  reduced: string[]
  reasons: string[]
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scoreOccasionSuitability(items: OccasionItem[], requestedOccasion?: string): OccasionScore {
  const occasion = normalizeOccasion(requestedOccasion)
  const rule = occasionRelationships[occasion]
  const keys = items.map(itemKnowledgeKey)
  const styles = items.map((item) => normalizeStyle(item.style))
  const avgFormality = items.reduce((sum, item) => {
    const knowledge = itemKnowledge(item)
    return sum + Number(item.formalityScore ?? knowledge.formality)
  }, 0) / Math.max(1, items.length)

  const matched = keys.filter((key) => rule.boost.includes(key) || rule.core.includes(key))
  const reduced = keys.filter((key) => rule.reduce.includes(key))
  const styleMatches = styles.filter((style) => rule.preferredStyles.includes(style))

  let score = 50
  score += matched.length * 10
  score += styleMatches.length * 5
  score -= reduced.length * 18
  if (avgFormality < rule.minFormality) score -= (rule.minFormality - avgFormality) * 0.75
  if (avgFormality > rule.maxFormality) score -= (avgFormality - rule.maxFormality) * 0.65

  const reasons = [
    matched.length ? `${rule.label} match: ${[...new Set(matched)].slice(0, 3).join(', ')}.` : `Needs a stronger ${rule.label.toLowerCase()} anchor.`,
    reduced.length ? `Reduced for ${[...new Set(reduced)].slice(0, 3).join(', ')}.` : rule.reasoning,
    styleMatches.length ? `Style direction supports ${rule.label.toLowerCase()}.` : ''
  ].filter(Boolean)

  return {
    occasion,
    score: clamp(score),
    matched: [...new Set(matched)],
    reduced: [...new Set(reduced)],
    reasons
  }
}

export function occasionCategoryPools(occasion?: string) {
  const rule = occasionRelationships[normalizeOccasion(occasion)]
  return {
    preferred: [...new Set([...rule.core, ...rule.boost])],
    reduced: rule.reduce,
    styles: rule.preferredStyles,
    label: rule.label
  }
}
