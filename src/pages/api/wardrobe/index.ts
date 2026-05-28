import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import { analyzeClothing } from '../../../lib/fashion'
import { parseTags } from '../../../lib/api'

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
    if (typeof category === 'string' && category) query.category = category
    if (typeof style === 'string' && style) query.style = style
    if (typeof season === 'string' && season) query.season = season
    if (typeof favorite === 'string') query.isFavorite = favorite === 'true'
    if (typeof color === 'string' && color) query.colors = color
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
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const { image, category, color, colors, style, season, tags, brand, fitType, material, occasion } = req.body
    if (!image) return res.status(400).json({ error: 'Image is required' })
    const parsedTags = parseTags(tags)
    const parsedOccasion = parseTags(occasion)
    const analysis = analyzeClothing(`${category || ''} ${color || ''} ${parsedTags.join(' ')} ${brand || ''} ${fitType || ''} ${material || ''}`)
    const item = await Clothing.create({
      userId,
      image,
      category: category || analysis.category,
      color: color || analysis.color,
      colors: colors?.length ? colors : analysis.colors,
      style: style || analysis.style,
      season: season || analysis.season,
      occasion: parsedOccasion.length ? parsedOccasion : analysis.occasion,
      tags: parsedTags.length ? parsedTags : analysis.tags,
      brand,
      fitType: fitType || analysis.fitType,
      material: material || analysis.material
    })
    return res.status(201).json(item)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
