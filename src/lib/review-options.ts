export const reviewCategories = [
  'tshirt',
  'shirt',
  'polo',
  'hoodie',
  'sweatshirt',
  'jacket',
  'coat',
  'blazer',
  'jeans',
  'cargo',
  'trousers',
  'shorts',
  'sneakers',
  'boots',
  'sandals',
  'accessories',
  'other'
] as const

export const reviewColors = [
  'black',
  'white',
  'gray',
  'navy',
  'blue',
  'red',
  'green',
  'olive',
  'brown',
  'beige',
  'cream',
  'yellow',
  'orange',
  'purple',
  'pink',
  'unknown'
] as const

export const reviewStyles = [
  'casual',
  'streetwear',
  'minimal',
  'formal',
  'vintage',
  'sporty',
  'techwear',
  'old-money',
  'y2k'
] as const

export const reviewSeasons = ['summer', 'winter', 'spring', 'autumn', 'all-season'] as const

export function normalizeReviewCategory(value?: string) {
  const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '-')
  if (text === 't-shirt' || text === 'tee') return 'tshirt'
  if (text === 'oldmoney') return 'old-money'
  return text || 'other'
}

export function normalizeReviewColor(value?: string) {
  const text = String(value || '').trim().toLowerCase()
  if (text === 'grey') return 'gray'
  return text || 'unknown'
}

export function displayReviewValue(value?: string) {
  const text = String(value || '').replace(/-/g, ' ')
  if (!text) return ''
  return text.replace(/\b\w/g, (char) => char.toUpperCase())
}
