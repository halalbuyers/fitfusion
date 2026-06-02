import type { NextApiRequest, NextApiResponse } from 'next'
import Clothing from '../../../models/Clothing'
import AdminActivityLog from '../../../models/AdminActivityLog'
import { getClientIp, requireAdmin } from '../../../lib/admin/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const query: Record<string, unknown> = {}
    ;['category', 'style', 'primaryColor'].forEach((field) => {
      const value = String(req.query[field] || '')
      if (value) query[field] = value
    })
    const items = await Clothing.find(query).sort({ createdAt: -1 }).limit(80).lean()
    return res.status(200).json({ items })
  }

  if (req.method === 'PATCH') {
    const { itemId, metadata, flagged } = req.body || {}
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' })
    const update = {
      ...(metadata || {}),
      ...(typeof flagged === 'boolean' ? { tags: flagged ? ['flagged'] : [] } : {})
    }
    const item = await Clothing.findByIdAndUpdate(itemId, update, { new: true })
    await AdminActivityLog.create({ userId: admin.userId, action: 'admin_action', target: itemId, ip: getClientIp(req), metadata: { contentModeration: true } })
    return res.status(200).json({ ok: true, item })
  }

  if (req.method === 'DELETE') {
    const itemId = String(req.query.itemId || '')
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' })
    await Clothing.findByIdAndDelete(itemId)
    await AdminActivityLog.create({ userId: admin.userId, action: 'admin_action', target: itemId, ip: getClientIp(req), metadata: { deletedItem: true } })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
