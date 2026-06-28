export function detectVisionSeason(input: { category?: string; material?: string; sleeveLength?: string; warmthScore?: number }) {
  const text = [input.category, input.material, input.sleeveLength].join(' ').toLowerCase()
  if (/wool|fleece|coat|jacket|hoodie|sweater|boots|long/.test(text) || Number(input.warmthScore || 0) >= 68) return 'winter'
  if (/linen|shorts|sleeveless|sandals|cotton/.test(text) || Number(input.warmthScore || 0) <= 24) return 'summer'
  if (/suede|brown|earth/.test(text)) return 'autumn'
  if (/shirt|lightweight|pastel/.test(text)) return 'spring'
  return 'all-season'
}

export function detectVisionOccasions(input: { category?: string; style?: string; material?: string; formalityScore?: number }) {
  const category = String(input.category || '').toLowerCase()
  const style = String(input.style || '').toLowerCase()
  const formality = Number(input.formalityScore || 45)
  const occasions = new Set<string>(['casual'])
  if (['tshirt', 'shirt', 'hoodie', 'jeans', 'cargo', 'sneakers'].includes(category)) occasions.add('college')
  if (style === 'sporty' || ['shorts', 'sneakers', 'tshirt'].includes(category)) occasions.add('gym')
  if (formality >= 58 || ['shirt', 'blazer', 'trousers', 'loafers'].includes(category)) occasions.add('office')
  if (formality >= 72 || ['dress', 'heels', 'blazer'].includes(category)) occasions.add('wedding')
  if (['jacket', 'hoodie', 'cargo', 'sneakers', 'boots'].includes(category)) occasions.add('travel')
  if (['streetwear', 'y2k', 'techwear'].includes(style)) occasions.add('streetwear')
  if (['dress', 'jacket', 'boots', 'heels', 'accessories'].includes(category)) occasions.add('party')
  if (['hoodie', 'shorts', 'slides', 'tshirt'].includes(category)) occasions.add('home')
  return [...occasions]
}

