import type { NextApiRequest, NextApiResponse } from 'next'
import AdminAnnouncement from '../../../../models/AdminAnnouncement'
import { requireAdmin } from '../../../../lib/admin/api'

const allowedTypes = ['announcement', 'maintenance', 'feature', 'update', 'fix']
const allowedStatuses = ['draft', 'published', 'archived']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!id) return res.status(400).json({ error: 'Missing id' })

  if (req.method === 'PUT') {
    const { description, ...body } = req.body || {}
    const update: Record<string, unknown> = { ...body }

    if (description !== undefined && update.body === undefined) update.body = description
    if (update.type && !allowedTypes.includes(String(update.type))) delete update.type
    if (update.status && !allowedStatuses.includes(String(update.status))) delete update.status
    if (update.priority !== undefined) update.priority = Number(update.priority || 0)
    if (update.displayOrder !== undefined) update.displayOrder = Number(update.displayOrder || 0)

    const announcement = await AdminAnnouncement.findByIdAndUpdate(id, update, { new: true })
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' })
    return res.status(200).json({ ok: true, announcement })
  }

  if (req.method === 'DELETE') {
    const announcement = await AdminAnnouncement.findByIdAndDelete(id)
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
