import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Subscription from '../../../models/Subscription'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
    const { userId } = getAuth(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
      const subscription = await Subscription.findOne({ userId })
      return res.status(200).json(subscription || { plan: 'free', status: 'active' })
    }

    if (req.method === 'POST') {
      const subscription = await Subscription.findOneAndUpdate({ userId }, { ...req.body, userId }, { upsert: true, new: true })
      return res.status(200).json(subscription)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('ECONNREFUSED') || message.includes('querySrv') || message.includes('MONGODB_URI')) {
      if (req.method === 'GET') return res.status(200).json({ plan: 'free', status: 'active' })
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
    }
    return res.status(500).json({ error: 'Failed to process subscription request.' })
  }
}
