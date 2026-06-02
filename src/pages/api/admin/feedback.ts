import type { NextApiRequest, NextApiResponse } from 'next'
import AdminFeedback from '../../../models/AdminFeedback'
import AdminActivityLog from '../../../models/AdminActivityLog'
import { requireAdmin } from '../../../lib/admin/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const status = String(req.query.status || '')
    const query = status ? { status } : {}
    const feedback = await AdminFeedback.find(query).sort({ createdAt: -1 }).limit(100).lean()
    return res.status(200).json({ feedback })
  }

  if (req.method === 'POST') {
    const feedback = await AdminFeedback.create(req.body)
    return res.status(201).json({ feedback })
  }

  if (req.method === 'PATCH') {
    const { id, status, reply } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const feedback = await AdminFeedback.findByIdAndUpdate(id, { status, reply }, { new: true })
    await AdminActivityLog.create({ userId: admin.userId, action: 'feedback_update', target: id, metadata: { status } })
    return res.status(200).json({ ok: true, feedback })
  }

  return res.status(405).end()
}
