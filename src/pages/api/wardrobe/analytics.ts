import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { buildWardrobeConsultantAnalysis } from '../../../lib/analysis/analyticsEngine'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'

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
    return res.status(200).json(buildWardrobeConsultantAnalysis(wardrobe as any[]))
  } catch {
    return res.status(200).json(buildWardrobeConsultantAnalysis([]))
  }
}

