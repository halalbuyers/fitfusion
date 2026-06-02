import type { NextApiRequest, NextApiResponse } from 'next'
import AdminAnnouncement from '../../../models/AdminAnnouncement'
import { requireAdmin } from '../../../lib/admin/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const announcements = await AdminAnnouncement.find().sort({ createdAt: -1 }).limit(50).lean()
    return res.status(200).json({ announcements })
  }

  if (req.method === 'POST') {
    try {
      const type = ['announcement', 'maintenance', 'feature'].includes(req.body?.type) ? req.body.type : 'announcement'
      const announcement = await AdminAnnouncement.create({ ...req.body, type, createdBy: admin.userId })
      return res.status(201).json({ announcement })
    } catch {
      return res.status(400).json({ error: 'Invalid announcement payload' })
    }
  }

  if (req.method === 'PATCH') {
    const { id, ...update } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const announcement = await AdminAnnouncement.findByIdAndUpdate(id, update, { new: true })
    return res.status(200).json({ ok: true, announcement })
  }

  return res.status(405).end()
}
