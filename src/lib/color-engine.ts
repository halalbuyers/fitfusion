export type ColorFamily =
  | 'black'
  | 'white'
  | 'gray'
  | 'navy'
  | 'blue'
  | 'light blue'
  | 'brown'
  | 'beige'
  | 'cream'
  | 'tan'
  | 'green'
  | 'olive'
  | 'red'
  | 'burgundy'
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
  cream: 'cream',
  beige: 'beige',
  tan: 'tan',
  khaki: 'beige',
  camel: 'beige',
  brown: 'brown',
  chocolate: 'brown',
  espresso: 'brown',
  navy: 'navy',
  blue: 'blue',
  lightblue: 'light blue',
  skyblue: 'light blue',
  denim: 'blue',
  cyan: 'blue',
  teal: 'blue',
  green: 'green',
  emerald: 'green',
  olive: 'olive',
  sage: 'olive',
  red: 'red',
  burgundy: 'burgundy',
  maroon: 'burgundy',
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

export const neutralColors = new Set<ColorFamily>(['black', 'white', 'gray', 'navy', 'brown', 'beige', 'cream', 'tan'])
const luxuryColors = new Set<ColorFamily>(['black', 'white', 'gray', 'navy', 'brown', 'beige', 'cream', 'tan', 'burgundy', 'metallic'])
const warmColors = new Set<ColorFamily>(['brown', 'beige', 'cream', 'tan', 'red', 'burgundy', 'pink', 'yellow', 'orange'])
const coolColors = new Set<ColorFamily>(['navy', 'blue', 'light blue', 'green', 'olive', 'purple', 'gray'])

const analogousGroups: ColorFamily[][] = [
  ['black', 'gray', 'white'],
  ['brown', 'beige', 'cream', 'tan', 'olive'],
  ['navy', 'blue', 'light blue', 'gray'],
  ['green', 'olive', 'beige'],
  ['red', 'burgundy', 'pink', 'purple'],
  ['yellow', 'orange', 'brown']
]

const complementaryPairs: Array<[ColorFamily, ColorFamily]> = [
  ['black', 'white'],
  ['navy', 'beige'],
  ['navy', 'cream'],
  ['navy', 'tan'],
  ['blue', 'brown'],
  ['light blue', 'tan'],
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
  'black:gray': 94,
  'gray:black': 94,
  'navy:beige': 94,
  'beige:navy': 94,
  'navy:cream': 93,
  'cream:navy': 93,
  'beige:black': 92,
  'black:beige': 92,
  'burgundy:cream': 88,
  'cream:burgundy': 88,
  'brown:green': 30,
  'green:brown': 30,
  'green:orange': 32,
  'orange:green': 32,
  'red:green': 34,
  'green:red': 34,
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
  return [...new Set(colors)]
}

export function hexToColorFamily(hex?: string): ColorFamily {
  const value = String(hex || '').replace('#', '').trim()
  if (!/^[0-9a-f]{6}$/i.test(value)) return 'unknown'

  const rgb: [number, number, number] = [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ]

  return rgbToFashionColor(rgb)
}

export function rgbToFashionColor([red, green, blue]: [number, number, number]): ColorFamily {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const brightness = max
  const saturation = max === 0 ? 0 : delta / max

  let hue = 0
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  if (brightness <= 0.16) return 'black'

  if (saturation <= 0.12) {
    if (brightness >= 0.82) return 'white'
    if (brightness <= 0.28) return 'black'
    return 'gray'
  }

  const isWarmNeutral = hue >= 28 && hue <= 62 && saturation <= 0.45
  if (isWarmNeutral && brightness >= 0.56) return 'beige'
  if (isWarmNeutral) return 'brown'

  if ((hue >= 0 && hue < 12) || hue >= 345) return brightness < 0.45 && saturation < 0.7 ? 'brown' : 'red'
  if (hue >= 12 && hue < 28) return brightness < 0.52 ? 'brown' : 'orange'
  if (hue >= 28 && hue < 52) return brightness > 0.72 && saturation < 0.72 ? 'beige' : 'yellow'
  if (hue >= 52 && hue < 72) return saturation < 0.55 ? 'olive' : 'yellow'
  if (hue >= 72 && hue < 155) return saturation < 0.5 && brightness < 0.65 ? 'olive' : 'green'
  if (hue >= 155 && hue < 190) return saturation < 0.45 ? 'green' : 'blue'
  if (hue >= 190 && hue < 250) return brightness < 0.35 ? 'navy' : 'blue'
  if (hue >= 250 && hue < 290) return 'purple'
  if (hue >= 290 && hue < 330) return saturation < 0.48 ? 'purple' : 'pink'
  if (hue >= 330 && hue < 345) return 'pink'

  return 'unknown'
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
