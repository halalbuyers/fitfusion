import sharp from 'sharp'
import { detectClothingRegion } from '../clothing-segmentation'

export type OptimizedImageResult = {
  optimizedPath: string
  thumbnailBuffer: Buffer
  blurDataUrl: string
  cropBox?: { left: number; top: number; width: number; height: number }
  warnings: string[]
}

export async function optimizeClothingImage(filePath: string): Promise<OptimizedImageResult> {
  const region = await detectClothingRegion(filePath).catch(() => null)
  const source = region?.buffer || await sharp(filePath).png().toBuffer()
  const optimizedPath = `${filePath}.vision.webp`
  await sharp(source)
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true, background: { r: 8, g: 8, b: 8, alpha: 0 } })
    .webp({ quality: 84 })
    .toFile(optimizedPath)
  const thumbnailBuffer = await sharp(source).resize(360, 360, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toBuffer()
  const blur = await sharp(source).resize(12, 12, { fit: 'inside' }).webp({ quality: 35 }).toBuffer()
  return {
    optimizedPath,
    thumbnailBuffer,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
    cropBox: region?.box,
    warnings: region?.warnings || []
  }
}

