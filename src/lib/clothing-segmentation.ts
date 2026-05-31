import sharp from 'sharp'

export type ClothingRegionStrategy = 'foreground-bounding-box' | 'center-weighted-crop' | 'full-image-fallback'

export type ClothingRegionBox = {
  left: number
  top: number
  width: number
  height: number
}

export type ClothingRegionResult = {
  buffer: Buffer
  box: ClothingRegionBox
  image: {
    width: number
    height: number
  }
  strategy: ClothingRegionStrategy
  clothingCoverage: number
  warnings: string[]
}

export type ClothingSegmentationOptions = {
  category?: string
  filename?: string
}

type Rgb = [number, number, number]

const EDGE_SAMPLE_RATIO = 0.14
const CENTER_BORDER_RATIO = 0.18
const MIN_FOREGROUND_COVERAGE = 0.08
const SMALL_CLOTHING_COVERAGE = 0.25

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function colorDistance(a: Rgb, b: Rgb) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

function centerCropBox(width: number, height: number): ClothingRegionBox {
  const left = Math.round(width * CENTER_BORDER_RATIO)
  const top = Math.round(height * CENTER_BORDER_RATIO)
  const right = Math.round(width * (1 - CENTER_BORDER_RATIO))
  const bottom = Math.round(height * (1 - CENTER_BORDER_RATIO))

  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  }
}

function expandBox(box: ClothingRegionBox, imageWidth: number, imageHeight: number, paddingRatio = 0.02): ClothingRegionBox {
  const padX = Math.round(box.width * paddingRatio)
  const padY = Math.round(box.height * paddingRatio)
  const left = clamp(box.left - padX, 0, imageWidth - 1)
  const top = clamp(box.top - padY, 0, imageHeight - 1)
  const right = clamp(box.left + box.width + padX, left + 1, imageWidth)
  const bottom = clamp(box.top + box.height + padY, top + 1, imageHeight)

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  }
}

function scaleBox(box: ClothingRegionBox, scaleX: number, scaleY: number, imageWidth: number, imageHeight: number): ClothingRegionBox {
  const left = clamp(Math.floor(box.left * scaleX), 0, imageWidth - 1)
  const top = clamp(Math.floor(box.top * scaleY), 0, imageHeight - 1)
  const right = clamp(Math.ceil((box.left + box.width) * scaleX), left + 1, imageWidth)
  const bottom = clamp(Math.ceil((box.top + box.height) * scaleY), top + 1, imageHeight)

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  }
}

async function estimateBackgroundColor(imageSource: string, width: number, height: number): Promise<Rgb> {
  const sampleWidth = Math.min(160, width)
  const sampleHeight = Math.max(1, Math.round((sampleWidth / width) * height))
  const { data, info } = await sharp(imageSource)
    .resize(sampleWidth, sampleHeight, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const edgeX = Math.max(1, Math.round(info.width * EDGE_SAMPLE_RATIO))
  const edgeY = Math.max(1, Math.round(info.height * EDGE_SAMPLE_RATIO))
  const totals = [0, 0, 0]
  let count = 0

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const isEdge = x < edgeX || x >= info.width - edgeX || y < edgeY || y >= info.height - edgeY
      if (!isEdge) continue

      const index = (y * info.width + x) * info.channels
      totals[0] += data[index]
      totals[1] += data[index + 1]
      totals[2] += data[index + 2]
      count += 1
    }
  }

  return [
    Math.round(totals[0] / Math.max(1, count)),
    Math.round(totals[1] / Math.max(1, count)),
    Math.round(totals[2] / Math.max(1, count))
  ]
}

async function estimateForegroundBox(imageSource: string, imageWidth: number, imageHeight: number, background: Rgb) {
  const sampleWidth = Math.min(240, imageWidth)
  const sampleHeight = Math.max(1, Math.round((sampleWidth / imageWidth) * imageHeight))
  const { data, info } = await sharp(imageSource)
    .resize(sampleWidth, sampleHeight, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let minX = info.width
  let minY = info.height
  let maxX = -1
  let maxY = -1
  let foregroundCount = 0
  const centerX = info.width / 2
  const centerY = info.height / 2
  const maxCenterDistance = Math.sqrt(centerX ** 2 + centerY ** 2)

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * info.channels
      const rgb: Rgb = [data[index], data[index + 1], data[index + 2]]
      const distanceFromBackground = colorDistance(rgb, background)
      const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / Math.max(1, maxCenterDistance)
      const centerBias = distanceFromCenter < 0.42 ? 12 : 0

      if (distanceFromBackground + centerBias < 48) continue

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      foregroundCount += 1
    }
  }

  const coverage = foregroundCount / Math.max(1, info.width * info.height)
  if (maxX < minX || maxY < minY) return { box: null, coverage }

  const sampleBox = {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  }

  return {
    box: scaleBox(sampleBox, imageWidth / info.width, imageHeight / info.height, imageWidth, imageHeight),
    coverage
  }
}

export async function detectClothingRegion(imageSource: string, _options: ClothingSegmentationOptions = {}): Promise<ClothingRegionResult> {
  const metadata = await sharp(imageSource).metadata()
  const width = metadata.width || 1
  const height = metadata.height || 1
  const warnings: string[] = []
  let strategy: ClothingRegionStrategy = 'center-weighted-crop'
  let box = centerCropBox(width, height)
  let clothingCoverage = box.width * box.height / Math.max(1, width * height)

  try {
    const background = await estimateBackgroundColor(imageSource, width, height)
    const foreground = await estimateForegroundBox(imageSource, width, height, background)
    clothingCoverage = foreground.coverage

    if (foreground.box && foreground.coverage >= MIN_FOREGROUND_COVERAGE) {
      box = expandBox(foreground.box, width, height)
      strategy = 'foreground-bounding-box'
    }
  } catch (error) {
    warnings.push(`foreground-estimation-failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (clothingCoverage < SMALL_CLOTHING_COVERAGE) {
    warnings.push('clothing-occupies-less-than-25-percent')
  }

  const buffer = await sharp(imageSource)
    .extract(box)
    .png()
    .toBuffer()
    .catch(async () => {
      strategy = 'full-image-fallback'
      warnings.push('clothing-crop-failed')
      return sharp(imageSource).png().toBuffer()
    })

  return {
    buffer,
    box,
    image: { width, height },
    strategy,
    clothingCoverage,
    warnings
  }
}
