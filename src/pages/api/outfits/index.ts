import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Outfit from '../../../models/Outfit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
    const { userId } = getAuth(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
      const outfits = await Outfit.find({ userId }).populate('items.clothing').sort({ createdAt: -1 })
      return res.status(200).json(outfits)
    }

    if (req.method === 'POST') {
      const outfit = await Outfit.create({ ...req.body, userId })
      return res.status(201).json(outfit)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('ECONNREFUSED') || message.includes('querySrv') || message.includes('MONGODB_URI')) {
      if (req.method === 'GET') return res.status(200).json([])
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
    }
    return res.status(500).json({ error: 'Failed to process outfits request.' })
  }
}
