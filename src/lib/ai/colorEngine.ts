import { getColorCompatibilityScore, getPaletteCompatibilityScore, normalizeColor, normalizeColors, type ColorFamily } from '../color-engine'

export type ColorMatchResult = {
  score: number
  colors: ColorFamily[]
  pairs: Array<{ colors: [ColorFamily, ColorFamily]; score: number; compatible: boolean }>
  badCombinations: string[]
  explanation: string
}

const universalColors = new Set<ColorFamily>(['black', 'white'])

const preferredColorMap: Partial<Record<ColorFamily, ColorFamily[]>> = {
  black: ['white', 'gray', 'navy', 'beige', 'cream', 'brown', 'olive', 'blue', 'burgundy'],
  white: ['black', 'gray', 'navy', 'beige', 'brown', 'olive', 'blue', 'burgundy'],
  gray: ['black', 'white', 'navy'],
  navy: ['white', 'beige', 'gray', 'cream', 'tan'],
  brown: ['beige', 'cream', 'blue', 'tan'],
  beige: ['brown', 'navy', 'black', 'white', 'olive'],
  cream: ['brown', 'navy', 'black', 'burgundy'],
  olive: ['beige', 'white', 'black', 'cream'],
  blue: ['white', 'gray', 'brown', 'tan'],
  burgundy: ['cream', 'black', 'gray']
}

const riskyPairs = new Set([
  'brown:green',
  'green:brown',
  'green:orange',
  'orange:green',
  'red:green',
  'green:red',
  'brown:yellow',
  'yellow:brown',
  'orange:purple',
  'purple:orange'
])

function key(a: ColorFamily, b: ColorFamily) {
  return `${a}:${b}`
}

export function areColorsCompatible(a?: string, b?: string, bold = false) {
  const first = normalizeColor(a)
  const second = normalizeColor(b)
  if (first === 'unknown' || second === 'unknown') return true
  if (universalColors.has(first) || universalColors.has(second)) return true
  if (preferredColorMap[first]?.includes(second) || preferredColorMap[second]?.includes(first)) return true
  if (!bold && riskyPairs.has(key(first, second))) return false
  return getColorCompatibilityScore(first, second) >= (bold ? 45 : 58)
}

export function analyzeColorCompatibility(values: Array<string | undefined>, options: { bold?: boolean } = {}): ColorMatchResult {
  const colors = normalizeColors(values)
  if (colors.length <= 1) {
    const color = colors[0] || 'unknown'
    return {
      score: color === 'unknown' ? 55 : 90,
      colors,
      pairs: [],
      badCombinations: [],
      explanation: color === 'unknown' ? 'Color data is limited.' : `${color} is easy to style as the main palette anchor.`
    }
  }

  const pairs: ColorMatchResult['pairs'] = []
  const badCombinations: string[] = []
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const score = getColorCompatibilityScore(colors[i], colors[j])
      const compatible = areColorsCompatible(colors[i], colors[j], options.bold)
      pairs.push({ colors: [colors[i], colors[j]], score, compatible })
      if (!compatible) badCombinations.push(`${colors[i]} with ${colors[j]}`)
    }
  }

  const baseScore = getPaletteCompatibilityScore(colors)
  const penalty = options.bold ? 0 : badCombinations.length * 12
  const score = Math.max(0, Math.min(100, Math.round(baseScore - penalty)))
  const bestPair = [...pairs].sort((a, b) => b.score - a.score)[0]

  return {
    score,
    colors,
    pairs,
    badCombinations,
    explanation: badCombinations.length
      ? `Palette needs caution around ${badCombinations.slice(0, 2).join(' and ')}.`
      : `${bestPair.colors[0]} pairs well with ${bestPair.colors[1]}, keeping the palette cohesive.`
  }
}

