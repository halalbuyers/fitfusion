import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import { analyzeClothingText, mergeFashionAnalysis, normalizeCategory } from '../../../lib/fashion-analysis'
import { parseTags } from '../../../lib/api'
import { EMBEDDING_VERSION, generateClothingEmbedding, needsEmbedding } from '../../../lib/embedding-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
  } catch (error: any) {
    if (req.method === 'GET') {
      return res.status(200).json([])
    }
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  const auth = getAuth(req)
  const userId = auth.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const query: Record<string, any> = { userId }
    const { category, color, style, season, occasion, favorite, q } = req.query
    if (typeof category === 'string' && category) query.category = { $in: [category, normalizeCategory(category)] }
    if (typeof style === 'string' && style) query.style = style
    if (typeof season === 'string' && season) query.season = season
    if (typeof favorite === 'string') query.$or = [{ isFavorite: favorite === 'true' }, { favorite: favorite === 'true' }]
    if (typeof color === 'string' && color) query.$or = [{ colors: color }, { primaryColor: color }]
    if (typeof occasion === 'string' && occasion) query.$or = [{ occasion }, { tags: occasion }]
    if (typeof q === 'string' && q) {
      query.$or = [
        { category: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { style: new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') }
      ]
    }
    const items = await Clothing.find(query).sort({ isFavorite: -1, createdAt: -1 })
    const staleItems = items.filter((item: any) => needsEmbedding(item)).slice(0, 12)
    if (staleItems.length) {
      await Promise.all(staleItems.map((item: any) => Clothing.updateOne(
        { _id: item._id, userId },
        { $set: { embedding: generateClothingEmbedding(item), embeddingVersion: EMBEDDING_VERSION } }
      ).catch(() => undefined)))
    }
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const { image, category, primaryColor, secondaryColors, color, colors, style, season, tags, brand, fit, fitType, material, occasion } = req.body
    if (!image) return res.status(400).json({ error: 'Image is required' })
    const parsedTags = parseTags(tags)
    const parsedOccasion = parseTags(occasion)
    const parsedColors = parseTags(colors)
    const parsedSecondaryColors = parseTags(secondaryColors)
    const fallback = analyzeClothingText(`${category || ''} ${primaryColor || color || ''} ${parsedTags.join(' ')} ${brand || ''} ${fit || fitType || ''} ${material || ''}`)
    const analysis = mergeFashionAnalysis(fallback, {
      category,
      primaryColor: primaryColor || color,
      secondaryColors: parsedSecondaryColors.length ? parsedSecondaryColors : parsedColors.slice(1),
      colors: parsedColors,
      style,
      season,
      fit: fit || fitType,
      fitType: fitType || fit,
      tags: parsedTags,
      occasion: parsedOccasion,
      material
    })
    const payload = {
      userId,
      image,
      category: normalizeCategory(category || analysis.category),
      primaryColor: analysis.primaryColor,
      secondaryColors: analysis.secondaryColors,
      color: analysis.primaryColor,
      colors: analysis.colors,
      style: analysis.style,
      season: analysis.season,
      occasion: parsedOccasion.length ? parsedOccasion : analysis.occasion,
      tags: parsedTags.length ? parsedTags : analysis.tags,
      brand,
      fit: analysis.fit,
      fitType: analysis.fitType,
      formalityScore: analysis.formalityScore,
      warmthScore: analysis.warmthScore,
      material: material || analysis.material
    }
    console.log('MONGODB SAVE COLORS:', {
      primaryColor: payload.primaryColor,
      colors: payload.colors
    })
    const item = await Clothing.create({
      ...payload,
      embedding: generateClothingEmbedding(payload),
      embeddingVersion: EMBEDDING_VERSION
    })
    return res.status(201).json(item)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
