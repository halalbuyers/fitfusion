import type { StylistMemory } from './types'

const openers = [
  'I would keep this polished and practical.',
  'Here is the strongest direction from your wardrobe.',
  'I have a clean option for you.',
  'This is the move I would make today.'
]

export function stylistTone(seed = '') {
  const index = Math.abs(seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % openers.length
  return openers[index]
}

export function memoryNudge(memory: StylistMemory) {
  const color = memory.favoriteColors[0] || memory.mostWornColors[0]
  if (!color) return ''
  if (color === 'black') return 'I know you lean monochrome, so I kept the base familiar and added one small chance for variety.'
  return `I kept it close to your usual ${color} palette so it still feels like you.`
}

export function fashionTeachingPoint(input: { colors?: string[]; hasLayer?: boolean; occasion?: string; weather?: string }) {
  const notes = [
    input.colors?.length ? `The color story works because ${input.colors.slice(0, 2).join(' and ')} keeps the outfit visually connected.` : '',
    input.hasLayer ? 'The layer adds depth without overcomplicating the silhouette.' : 'Keeping the layers minimal makes the proportions cleaner.',
    input.weather ? `For ${input.weather} weather, fabric weight and footwear matter more than adding extra pieces.` : '',
    input.occasion ? `For ${input.occasion}, the outfit needs to look intentional without feeling forced.` : ''
  ].filter(Boolean)
  return notes.slice(0, 3).join(' ')
}

