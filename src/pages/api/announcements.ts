import type { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '../../lib/mongodb'
import AdminAnnouncement from '../../models/AdminAnnouncement'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    await connectToDatabase()
    const now = new Date()
    const announcements = await AdminAnnouncement.find({
      status: 'published',
      isActive: true,
      audience: { $in: ['all', 'users'] },
      $and: [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] }
      ]
    }).sort({ pinned: -1, featured: -1, displayOrder: 1, priority: -1, createdAt: -1 }).lean()

    const payload = announcements.map((announcement) => ({
      ...announcement,
      description: announcement.body,
      body: announcement.body,
      pinned: Boolean(announcement.pinned),
      featured: Boolean(announcement.featured),
      displayOrder: Number(announcement.displayOrder || 0),
      priority: Number(announcement.priority || 0),
      creditedUsername: announcement.creditedUsername || announcement.suggestedByUsername,
      suggestedByUsername: announcement.suggestedByUsername || announcement.creditedUsername,
      publishedAt: announcement.publishedAt || announcement.createdAt || new Date().toISOString()
    }))

    return res.status(200).json({ announcements: payload })
  } catch {
    return res.status(200).json({ announcements: [] })
  }
}
