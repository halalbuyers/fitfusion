import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import { buildShoppingRecommendations } from '../../../lib/shopping/recommendationEngine'
import type { ShoppingWardrobeItem } from '../../../lib/shopping/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
    const wardrobe = await Clothing.find({ userId }).sort({ createdAt: -1 }).lean()
    res.setHeader('Cache-Control', 'private, max-age=60, stale-while-revalidate=240')
    return res.status(200).json(buildShoppingRecommendations(wardrobe as ShoppingWardrobeItem[]))
  } catch {
    res.setHeader('Cache-Control', 'private, max-age=30')
    return res.status(200).json(buildShoppingRecommendations([]))
  }
}

