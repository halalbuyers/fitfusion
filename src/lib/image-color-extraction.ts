import { Vibrant } from 'node-vibrant/node'
import { hexToColorFamily, normalizeColors } from './color-engine'

export type ExtractedImageColors = {
  primaryColor: string
  secondaryColors: string[]
  colors: string[]
  rawHex: string[]
}

export async function extractImageColors(imageSource: string): Promise<ExtractedImageColors> {
  const palette = await Vibrant.from(imageSource).maxColorCount(8).quality(3).getPalette()
  const swatches = [
    palette.Vibrant,
    palette.DarkVibrant,
    palette.LightVibrant,
    palette.Muted,
    palette.DarkMuted,
    palette.LightMuted
  ].filter(Boolean)

  const rawHex = swatches.map((swatch) => swatch!.hex).filter(Boolean)
  const colors = normalizeColors(rawHex.map(hexToColorFamily)).filter((color) => color !== 'unknown')

  return {
    primaryColor: colors[0] || 'unknown',
    secondaryColors: colors.slice(1, 4),
    colors,
    rawHex
  }
}

