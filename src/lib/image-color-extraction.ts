import { Vibrant } from 'node-vibrant/node'
import sharp from 'sharp'
import { hexToColorFamily, normalizeColors, type ColorFamily } from './color-engine'
import { detectClothingRegion, type ClothingRegionResult } from './clothing-segmentation'

export type ImageColorExtractionOptions = {
  category?: string
  filename?: string
}

export type ExtractedImageColors = {
  primaryColor: string
  secondaryColors: string[]
  colors: string[]
  rawHex: string[]
  extractionFailed?: boolean
  region?: {
    strategy: ClothingRegionResult['strategy']
    box: ClothingRegionResult['box']
    clothingCoverage: number
    warnings: string[]
  }
}

const supportedMimeTypes = new Set(['image/webp', 'image/jpeg', 'image/jpg', 'image/png'])
const MIN_DOMINANT_AREA = 0.1

function mimeFromFormat(format?: string) {
  if (format === 'jpg') return 'image/jpg'
  if (format === 'jpeg') return 'image/jpeg'
  if (format === 'png') return 'image/png'
  if (format === 'webp') return 'image/webp'
  return format ? `image/${format}` : 'unknown'
}

function rgbToHex(rgb: number[]) {
  return `#${rgb.slice(0, 3).map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function extractionFailure(error: unknown): ExtractedImageColors {
  console.log('VIBRANT COLORS:', { error: error instanceof Error ? error.message : error })
  return {
    primaryColor: 'unknown',
    secondaryColors: [],
    colors: [],
    rawHex: [],
    extractionFailed: true
  }
}

async function sourceToPngBuffer(imageSource: string) {
  return sharp(imageSource).png().toBuffer()
}

async function dominantColorAreas(imageSource: string | Buffer) {
  const { data, info } = await sharp(imageSource)
    .resize(96, 96, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const counts = new Map<ColorFamily, number>()
  let total = 0

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * info.channels
      const hex = rgbToHex([data[index], data[index + 1], data[index + 2]])
      const color = hexToColorFamily(hex)
      if (color === 'unknown') continue
      counts.set(color, (counts.get(color) || 0) + 1)
      total += 1
    }
  }

  return [...counts.entries()]
    .map(([color, count]) => ({ color, area: count / Math.max(1, total) }))
    .sort((a, b) => b.area - a.area)
}

async function analyzeColorsFromSource(imageSource: string | Buffer) {
  const palette = await Vibrant.from(imageSource).maxColorCount(8).quality(3).getPalette()
  const namedSwatches = [
    ['Vibrant', palette.Vibrant],
    ['DarkVibrant', palette.DarkVibrant],
    ['LightVibrant', palette.LightVibrant],
    ['Muted', palette.Muted],
    ['DarkMuted', palette.DarkMuted],
    ['LightMuted', palette.LightMuted]
  ] as const
  const swatches = namedSwatches
    .map(([, swatch]) => swatch)
    .filter(Boolean)
    .sort((a, b) => (b!.population || 0) - (a!.population || 0))

  let rawHex = swatches.map((swatch) => swatch!.hex).filter(Boolean)
  const rawVibrantColors = namedSwatches
    .filter(([, swatch]) => Boolean(swatch))
    .map(([name, swatch]) => ({
      name,
      hex: swatch!.hex,
      rgb: swatch!.rgb,
      population: swatch!.population
    }))

  if (!rawHex.length) {
    const stats = await sharp(imageSource).stats()
    rawHex = [rgbToHex(stats.channels.slice(0, 3).map((channel) => channel.mean))]
  }

  const mappedColors = rawHex.map(hexToColorFamily)
  const vibrantColors = normalizeColors(mappedColors).filter((color) => color !== 'unknown')
  const areas = await dominantColorAreas(imageSource)
  const dominantColors = areas.filter((entry) => entry.area >= MIN_DOMINANT_AREA).map((entry) => entry.color)
  const colors = dominantColors.length
    ? [...new Set([...dominantColors, ...vibrantColors.filter((color) => areas.some((entry) => entry.color === color && entry.area >= MIN_DOMINANT_AREA))])]
    : vibrantColors

  return {
    rawHex,
    rawVibrantColors,
    mappedColors,
    vibrantColors,
    dominantAreas: areas,
    colors
  }
}

export async function extractImageColors(imageSource: string, options: ImageColorExtractionOptions = {}): Promise<ExtractedImageColors> {
  try {
    const image = sharp(imageSource)
    const metadata = await image.metadata()
    const format = metadata.format || 'unknown'
    const mimeType = mimeFromFormat(format)

    console.log('IMAGE MIME:', mimeType)
    console.log('IMAGE FORMAT:', format)

    if (!supportedMimeTypes.has(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}`)
    }

    const fullImageSource = mimeType === 'image/webp' ? await sourceToPngBuffer(imageSource) : imageSource
    const fullImageColors = await analyzeColorsFromSource(fullImageSource)
    const clothingRegion = await detectClothingRegion(imageSource, options)
    const centerCropColors = await analyzeColorsFromSource(clothingRegion.buffer)
    const finalColors = centerCropColors.colors.length ? centerCropColors : fullImageColors

    console.log('FULL IMAGE COLORS:', {
      colors: fullImageColors.colors,
      rawHex: fullImageColors.rawHex,
      dominantAreas: fullImageColors.dominantAreas
    })
    console.log('CENTER CROP COLORS:', {
      colors: centerCropColors.colors,
      rawHex: centerCropColors.rawHex,
      dominantAreas: centerCropColors.dominantAreas,
      region: clothingRegion
    })
    console.log('RAW VIBRANT COLORS:', finalColors.rawVibrantColors)
    console.log('VIBRANT COLORS:', finalColors.vibrantColors)
    console.log('NORMALIZED COLORS:', {
      rawHex: finalColors.rawHex,
      mappedColors: finalColors.mappedColors,
      colors: finalColors.colors
    })
    console.log('FINAL CLOTHING COLORS:', {
      primaryColor: finalColors.colors[0] || 'unknown',
      colors: finalColors.colors,
      region: {
        strategy: clothingRegion.strategy,
        box: clothingRegion.box,
        clothingCoverage: clothingRegion.clothingCoverage,
        warnings: clothingRegion.warnings
      }
    })

    return {
      primaryColor: finalColors.colors[0] || 'unknown',
      secondaryColors: finalColors.colors.slice(1, 4),
      colors: finalColors.colors,
      rawHex: finalColors.rawHex,
      extractionFailed: false,
      region: {
        strategy: clothingRegion.strategy,
        box: clothingRegion.box,
        clothingCoverage: clothingRegion.clothingCoverage,
        warnings: clothingRegion.warnings
      }
    }
  } catch (error) {
    return extractionFailure(error)
  }
}
