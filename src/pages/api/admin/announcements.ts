import type { NextApiRequest, NextApiResponse } from 'next'
import AdminAnnouncement from '../../../models/AdminAnnouncement'
import { requireAdmin } from '../../../lib/admin/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const announcements = await AdminAnnouncement.find().sort({ featured: -1, displayOrder: 1, priority: -1, createdAt: -1 }).limit(100).lean()
    return res.status(200).json({ announcements })
  }

  if (req.method === 'POST') {
    try {
      const type = ['announcement', 'maintenance', 'feature', 'update', 'fix'].includes(req.body?.type) ? req.body.type : 'update'
      const announcement = await AdminAnnouncement.create({
        ...req.body,
        body: req.body.description || req.body.body,
        type,
        createdBy: admin.userId,
        status: req.body?.status || 'published',
        isActive: req.body?.isActive !== false,
        featured: req.body?.featured === true,
        priority: Number(req.body?.priority || 0),
        displayOrder: Number(req.body?.displayOrder || 0)
      })
      return res.status(201).json({ announcement })
    } catch {
      return res.status(400).json({ error: 'Invalid announcement payload' })
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { id, description, ...update } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    if (description && !update.body) update.body = description
    if (update.priority !== undefined) update.priority = Number(update.priority || 0)
    if (update.displayOrder !== undefined) update.displayOrder = Number(update.displayOrder || 0)
    const announcement = await AdminAnnouncement.findByIdAndUpdate(id, update, { new: true })
    return res.status(200).json({ ok: true, announcement })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    await AdminAnnouncement.findByIdAndDelete(id)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
