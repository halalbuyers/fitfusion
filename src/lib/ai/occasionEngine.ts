import { normalizeCategory, normalizeStyle } from '../fashion-analysis'
import { itemKnowledgeKey } from '../fashion-knowledge'

export type StylistOccasion = 'casual' | 'college' | 'office' | 'formal' | 'wedding' | 'party' | 'gym' | 'travel' | 'home' | 'streetwear'

type OccasionItem = {
  category?: string
  style?: string
  occasion?: string[]
  tags?: string[]
  formalityScore?: number
}

const aliases: Record<string, StylistOccasion> = {
  casual: 'casual',
  college: 'college',
  campus: 'college',
  office: 'office',
  work: 'office',
  formal: 'formal',
  wedding: 'wedding',
  party: 'party',
  gym: 'gym',
  workout: 'gym',
  travel: 'travel',
  airport: 'travel',
  home: 'home',
  lounge: 'home',
  streetwear: 'streetwear',
  street: 'streetwear'
}

const rules: Record<StylistOccasion, { categories: string[]; styles: string[]; avoid: string[]; min: number; max: number }> = {
  casual: { categories: ['tshirt', 'shirt', 'jeans', 'cargo', 'shorts', 'sneakers'], styles: ['casual', 'minimal', 'streetwear'], avoid: ['oxford-shoes'], min: 8, max: 75 },
  college: { categories: ['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'sneakers'], styles: ['casual', 'streetwear', 'minimal', 'sporty'], avoid: ['heels', 'oxford-shoes'], min: 5, max: 68 },
  office: { categories: ['shirt', 'dress-shirt', 'polo', 'chinos', 'trousers', 'loafers', 'blazer'], styles: ['minimal', 'formal', 'old-money'], avoid: ['hoodie', 'slides', 'gym-shorts'], min: 50, max: 90 },
  formal: { categories: ['shirt', 'dress-shirt', 'blazer', 'trousers', 'loafers', 'oxford-shoes', 'dress', 'heels'], styles: ['formal', 'minimal', 'old-money'], avoid: ['hoodie', 'shorts', 'slides', 'cargo'], min: 65, max: 100 },
  wedding: { categories: ['dress-shirt', 'blazer', 'trousers', 'loafers', 'oxford-shoes', 'dress', 'heels'], styles: ['formal', 'minimal', 'old-money'], avoid: ['hoodie', 'sneakers', 'slides', 'cargo'], min: 72, max: 100 },
  party: { categories: ['shirt', 'jacket', 'jeans', 'dress', 'boots', 'heels', 'accessories'], styles: ['streetwear', 'formal', 'y2k', 'minimal'], avoid: ['slides', 'gym-shorts'], min: 30, max: 92 },
  gym: { categories: ['tshirt', 'shorts', 'gym-shorts', 'sneakers', 'hoodie'], styles: ['sporty', 'casual'], avoid: ['blazer', 'loafers', 'oxford-shoes', 'boots'], min: 0, max: 45 },
  travel: { categories: ['tshirt', 'hoodie', 'jacket', 'jeans', 'cargo', 'sneakers'], styles: ['casual', 'streetwear', 'techwear', 'minimal'], avoid: ['heels', 'oxford-shoes'], min: 5, max: 70 },
  home: { categories: ['tshirt', 'hoodie', 'shorts', 'joggers', 'slides'], styles: ['casual', 'sporty', 'minimal'], avoid: ['blazer', 'oxford-shoes', 'heels'], min: 0, max: 45 },
  streetwear: { categories: ['oversized-tshirt', 'tshirt', 'hoodie', 'jacket', 'cargo', 'jeans', 'sneakers', 'accessories'], styles: ['streetwear', 'y2k', 'techwear'], avoid: ['oxford-shoes', 'loafers'], min: 5, max: 70 }
}

export function normalizeStylistOccasion(value?: string): StylistOccasion {
  const key = String(value || 'casual').trim().toLowerCase().replace(/\s+/g, '-')
  return aliases[key] || 'casual'
}

export function itemOccasionTags(item: OccasionItem): StylistOccasion[] {
  const explicit = (item.occasion || item.tags || []).map((tag) => aliases[String(tag).toLowerCase()]).filter(Boolean) as StylistOccasion[]
  const key = itemKnowledgeKey(item)
  const category = normalizeCategory(item.category)
  const style = normalizeStyle(item.style)
  const inferred = Object.entries(rules)
    .filter(([, rule]) => rule.categories.includes(key) || rule.categories.includes(category) || rule.styles.includes(style))
    .map(([occasion]) => occasion as StylistOccasion)
  return [...new Set([...explicit, ...inferred])]
}

export function scoreOccasionMatch(items: OccasionItem[], requested?: string) {
  const occasion = normalizeStylistOccasion(requested)
  const rule = rules[occasion]
  const keys = items.map(itemKnowledgeKey)
  const styles = items.map((item) => normalizeStyle(item.style))
  const explicitMatches = items.filter((item) => itemOccasionTags(item).includes(occasion)).length
  const categoryMatches = keys.filter((key) => rule.categories.includes(key)).length
  const styleMatches = styles.filter((style) => rule.styles.includes(style)).length
  const avoided = keys.filter((key) => rule.avoid.includes(key))
  const avgFormality = items.reduce((sum, item) => sum + Number(item.formalityScore ?? 45), 0) / Math.max(1, items.length)
  let score = 45 + explicitMatches * 10 + categoryMatches * 9 + styleMatches * 5 - avoided.length * 18
  if (avgFormality < rule.min) score -= (rule.min - avgFormality) * 0.7
  if (avgFormality > rule.max) score -= (avgFormality - rule.max) * 0.65
  score = Math.max(0, Math.min(100, Math.round(score)))
  return {
    occasion,
    score,
    matched: [...new Set(keys.filter((key) => rule.categories.includes(key)))],
    avoided: [...new Set(avoided)],
    reasons: [
      score >= 75 ? `Strong ${occasion} compatibility.` : `Partial ${occasion} compatibility.`,
      avoided.length ? `Reduced for ${[...new Set(avoided)].join(', ')}.` : 'No major occasion conflicts.'
    ]
  }
}

