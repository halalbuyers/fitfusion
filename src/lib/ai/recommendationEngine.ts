import { normalizeCategory } from '../fashion-analysis'

export type MissingWardrobeEssential = {
  title: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedCombinationIncrease: number
}

type WardrobeItem = { category?: string; primaryColor?: string; color?: string; colors?: string[]; season?: string; style?: string }

function hasItem(wardrobe: WardrobeItem[], category: string, color?: string) {
  return wardrobe.some((item) => {
    const colors = [item.primaryColor || item.color, ...(item.colors || [])].map((value) => String(value || '').toLowerCase())
    return normalizeCategory(item.category) === category && (!color || colors.includes(color))
  })
}

function increase(wardrobe: WardrobeItem[], category: string) {
  const tops = wardrobe.filter((item) => ['tshirt', 'shirt', 'hoodie'].includes(normalizeCategory(item.category))).length || 1
  const bottoms = wardrobe.filter((item) => ['jeans', 'cargo', 'shorts'].includes(normalizeCategory(item.category))).length || 1
  const shoes = wardrobe.filter((item) => ['sneakers', 'boots', 'heels'].includes(normalizeCategory(item.category))).length || 1
  if (['tshirt', 'shirt', 'hoodie'].includes(category)) return bottoms * shoes
  if (['jeans', 'cargo', 'shorts'].includes(category)) return tops * shoes
  if (['sneakers', 'boots', 'heels'].includes(category)) return tops * bottoms
  return Math.max(4, Math.round((tops * bottoms * shoes) / 3))
}

export function detectMissingEssentials(wardrobe: WardrobeItem[]): MissingWardrobeEssential[] {
  const suggestions: MissingWardrobeEssential[] = []
  const add = (title: string, category: string, reason: string, priority: MissingWardrobeEssential['priority']) => {
    suggestions.push({ title, reason, priority, estimatedCombinationIncrease: increase(wardrobe, category) })
  }
  if (!hasItem(wardrobe, 'sneakers', 'white')) add('White Sneakers', 'sneakers', 'Clean neutral footwear unlocks casual, college, travel, and streetwear outfits.', 'high')
  if (!hasItem(wardrobe, 'jeans', 'black')) add('Black Jeans', 'jeans', 'A dark neutral bottom stabilizes sharper casual and party looks.', 'high')
  if (!hasItem(wardrobe, 'hoodie', 'beige')) add('Beige Hoodie', 'hoodie', 'A lighter layer adds warmth without repeating black every day.', 'medium')
  if (!hasItem(wardrobe, 'shirt', 'white')) add('White Shirt', 'shirt', 'A white shirt bridges office, formal, wedding, and smart casual styling.', 'high')
  if (!wardrobe.some((item) => normalizeCategory(item.category) === 'shorts')) add('Tailored Shorts', 'shorts', 'Hot weather needs breathable bottom options.', 'medium')
  return suggestions.sort((a, b) => b.estimatedCombinationIncrease - a.estimatedCombinationIncrease).slice(0, 5)
}

