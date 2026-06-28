import { extractImageColors, type ExtractedImageColors } from '../image-color-extraction'

export type VisionColorPalette = ExtractedImageColors & {
  accentColors: string[]
  palette: Array<{ name: string; hex?: string }>
}

export async function extractVisionColors(imagePath: string, options: { category?: string; filename?: string } = {}): Promise<VisionColorPalette> {
  const colors = await extractImageColors(imagePath, options)
  return {
    ...colors,
    accentColors: colors.colors.slice(2, 5),
    palette: colors.colors.map((name, index) => ({ name, hex: colors.rawHex[index] }))
  }
}

