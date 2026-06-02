import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../lib/mongodb'
import AdminAnnouncement from '../../models/AdminAnnouncement'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
    const now = new Date()
    const announcements = await AdminAnnouncement.find({
      status: 'published',
      audience: { $in: ['all', 'users'] },
      $and: [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] }
      ]
    }).sort({ createdAt: -1 }).limit(3).lean()

    return res.status(200).json({ announcements })
  } catch {
    return res.status(200).json({ announcements: [] })
  }
}
