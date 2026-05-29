export type ColorFamily =
  | 'black'
  | 'white'
  | 'gray'
  | 'navy'
  | 'blue'
  | 'brown'
  | 'beige'
  | 'green'
  | 'olive'
  | 'red'
  | 'pink'
  | 'yellow'
  | 'orange'
  | 'purple'
  | 'metallic'
  | 'unknown'

const colorAliases: Record<string, ColorFamily> = {
  black: 'black',
  charcoal: 'gray',
  grey: 'gray',
  gray: 'gray',
  silver: 'metallic',
  white: 'white',
  ivory: 'white',
  cream: 'beige',
  beige: 'beige',
  tan: 'beige',
  khaki: 'beige',
  camel: 'beige',
  brown: 'brown',
  chocolate: 'brown',
  espresso: 'brown',
  navy: 'navy',
  blue: 'blue',
  denim: 'blue',
  cyan: 'blue',
  teal: 'blue',
  green: 'green',
  emerald: 'green',
  olive: 'olive',
  sage: 'olive',
  red: 'red',
  burgundy: 'red',
  maroon: 'red',
  pink: 'pink',
  rose: 'pink',
  yellow: 'yellow',
  mustard: 'yellow',
  orange: 'orange',
  rust: 'orange',
  purple: 'purple',
  lavender: 'purple',
  gold: 'metallic'
}

const colorCentroids: Record<Exclude<ColorFamily, 'unknown'>, [number, number, number]> = {
  black: [20, 20, 20],
  white: [238, 238, 230],
  gray: [128, 128, 128],
  navy: [18, 32, 72],
  blue: [48, 112, 190],
  brown: [104, 68, 42],
  beige: [198, 176, 132],
  green: [42, 130, 76],
  olive: [100, 112, 52],
  red: [180, 42, 48],
  pink: [214, 108, 146],
  yellow: [218, 184, 52],
  orange: [206, 108, 42],
  purple: [112, 70, 152],
  metallic: [174, 164, 142]
}

export const neutralColors = new Set<ColorFamily>(['black', 'white', 'gray', 'navy', 'brown', 'beige'])
const luxuryColors = new Set<ColorFamily>(['black', 'white', 'gray', 'navy', 'brown', 'beige', 'metallic'])
const warmColors = new Set<ColorFamily>(['brown', 'beige', 'red', 'pink', 'yellow', 'orange'])
const coolColors = new Set<ColorFamily>(['navy', 'blue', 'green', 'olive', 'purple', 'gray'])

const analogousGroups: ColorFamily[][] = [
  ['black', 'gray', 'white'],
  ['brown', 'beige', 'olive'],
  ['navy', 'blue', 'gray'],
  ['green', 'olive', 'beige'],
  ['red', 'pink', 'purple'],
  ['yellow', 'orange', 'brown']
]

const complementaryPairs: Array<[ColorFamily, ColorFamily]> = [
  ['black', 'white'],
  ['navy', 'beige'],
  ['blue', 'brown'],
  ['blue', 'orange'],
  ['green', 'red'],
  ['olive', 'white'],
  ['olive', 'beige'],
  ['purple', 'yellow'],
  ['gray', 'white'],
  ['brown', 'blue']
]

const pairOverrides: Record<string, number> = {
  'black:white': 95,
  'beige:black': 92,
  'black:beige': 92,
  'brown:green': 30,
  'green:brown': 30,
  'green:orange': 32,
  'orange:green': 32,
  'brown:yellow': 42,
  'orange:purple': 38,
  'purple:orange': 38
}

function key(a: ColorFamily, b: ColorFamily) {
  return `${a}:${b}`
}

export function normalizeColor(value?: string): ColorFamily {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '')
  if (!normalized) return 'unknown'
  return colorAliases[normalized] || (Object.keys(colorAliases).find((alias) => normalized.includes(alias)) ? colorAliases[Object.keys(colorAliases).find((alias) => normalized.includes(alias)) as string] : 'unknown')
}

export function normalizeColors(values: Array<string | undefined> = []): ColorFamily[] {
  const colors = values.map(normalizeColor).filter((color) => color !== 'unknown')
  return [...new Set(colors.length ? colors : (['black'] as ColorFamily[]))]
}

export function hexToColorFamily(hex?: string): ColorFamily {
  const value = String(hex || '').replace('#', '').trim()
  if (!/^[0-9a-f]{6}$/i.test(value)) return 'unknown'

  const rgb: [number, number, number] = [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ]

  const [family] = Object.entries(colorCentroids)
    .map(([name, centroid]) => {
      const distance = Math.sqrt(
        (rgb[0] - centroid[0]) ** 2 +
        (rgb[1] - centroid[1]) ** 2 +
        (rgb[2] - centroid[2]) ** 2
      )
      return [name as ColorFamily, distance] as const
    })
    .sort((a, b) => a[1] - b[1])[0]

  return family
}

export function areComplementary(a: string, b: string) {
  const first = normalizeColor(a)
  const second = normalizeColor(b)
  return complementaryPairs.some(([left, right]) => (left === first && right === second) || (left === second && right === first))
}

export function areAnalogous(a: string, b: string) {
  const first = normalizeColor(a)
  const second = normalizeColor(b)
  return analogousGroups.some((group) => group.includes(first) && group.includes(second))
}

export function isNeutralColor(color: string) {
  return neutralColors.has(normalizeColor(color))
}

export function isLuxuryPalette(colors: string[]) {
  const normalized = normalizeColors(colors)
  return normalized.length > 0 && normalized.every((color) => luxuryColors.has(color)) && normalized.some((color) => ['black', 'navy', 'brown', 'beige'].includes(color))
}

export function isMonochromePalette(colors: string[]) {
  const normalized = normalizeColors(colors)
  if (normalized.length <= 1) return true
  return normalized.every((color) => ['black', 'white', 'gray'].includes(color)) || new Set(normalized).size === 1
}

export function getColorCompatibilityScore(a: string, b: string) {
  const first = normalizeColor(a)
  const second = normalizeColor(b)
  if (first === 'unknown' || second === 'unknown') return 55
  if (pairOverrides[key(first, second)] !== undefined) return pairOverrides[key(first, second)]
  if (first === second) return neutralColors.has(first) ? 88 : 78
  if (areComplementary(first, second)) return 88
  if (neutralColors.has(first) && neutralColors.has(second)) return 90
  if (neutralColors.has(first) || neutralColors.has(second)) return 76
  if (areAnalogous(first, second)) return 72
  if ((warmColors.has(first) && warmColors.has(second)) || (coolColors.has(first) && coolColors.has(second))) return 66
  return 48
}

export function getPaletteCompatibilityScore(colors: string[]) {
  const normalized = normalizeColors(colors)
  if (normalized.length <= 1) return normalized[0] && neutralColors.has(normalized[0]) ? 90 : 80

  const pairs: number[] = []
  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      pairs.push(getColorCompatibilityScore(normalized[i], normalized[j]))
    }
  }

  let score = pairs.reduce((sum, value) => sum + value, 0) / Math.max(1, pairs.length)
  const neutralCount = normalized.filter((color) => neutralColors.has(color)).length
  if (neutralCount >= 2) score += 8
  if (isMonochromePalette(normalized)) score += 6
  if (isLuxuryPalette(normalized)) score += 7
  if (normalized.length > 4) score -= 12

  return Math.max(0, Math.min(100, Math.round(score)))
}
