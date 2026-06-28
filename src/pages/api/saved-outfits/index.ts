import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Outfit from '../../../models/Outfit'
import Clothing from '../../../models/Clothing'
import { recordOutfitInteraction } from '../../../lib/learning-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
  } catch {
    if (req.method === 'GET') return res.status(200).json([])
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { from, to } = req.query
    const query: Record<string, any> = { userId }
    if (typeof from === 'string' || typeof to === 'string') {
      query.plannedFor = {}
      if (typeof from === 'string') query.plannedFor.$gte = new Date(from)
      if (typeof to === 'string') query.plannedFor.$lte = new Date(to)
    }
    const outfits = await Outfit.find(query).populate('items.clothing').sort({ plannedFor: 1, createdAt: -1 })
    return res.status(200).json(outfits)
  }

  if (req.method === 'POST') {
    const { outfit, plannedFor, notes } = req.body
    if (!outfit?.items?.length) return res.status(400).json({ error: 'Outfit items are required' })
    const saved = await Outfit.create({
      userId,
      title: outfit.title || 'Saved Noir Closet outfit',
      occasion: outfit.occasion || 'casual',
      items: outfit.items.map((item: any) => ({ clothing: item.id || item.clothing?._id || item.clothing, role: item.role })),
      score: outfit.score || 0,
      explanation: outfit.explanation || notes,
      colorAnalysis: outfit.colorAnalysis,
      breakdown: outfit.breakdown || {},
      tags: outfit.tags || [],
      outfitKey: outfit.outfitKey,
      confidence: outfit.confidence,
      confidenceLabel: outfit.confidenceLabel,
      weatherMatch: outfit.weatherMatch,
      missingEssentials: outfit.missingEssentials,
      method: outfit.method || 'local',
      isFavorite: true,
      plannedFor: plannedFor ? new Date(plannedFor) : undefined
    })
    await Promise.all([
      recordOutfitInteraction({ userId, outfitId: String(saved._id), outfitKey: saved.outfitKey, action: 'saved', outfit: saved }).catch(() => null),
      Clothing.updateMany(
        { _id: { $in: saved.items.map((item: any) => item.clothing).filter(Boolean) } },
        { $inc: { usageCount: 1 } }
      ).catch(() => null)
    ])
    return res.status(201).json(saved)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
