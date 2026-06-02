import type { NextApiRequest, NextApiResponse } from 'next'
import AdminSetting from '../../../models/AdminSetting'
import AdminActivityLog from '../../../models/AdminActivityLog'
import { requireAdmin } from '../../../lib/admin/api'
import { getAdminSettings } from '../../../lib/admin/metrics'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') return res.status(200).json({ settings: await getAdminSettings() })

  if (req.method === 'PATCH') {
    const settings = await AdminSetting.findOneAndUpdate({}, { ...req.body, updatedBy: admin.userId }, { upsert: true, new: true })
    await AdminActivityLog.create({ userId: admin.userId, action: 'setting_update', metadata: req.body })
    return res.status(200).json({ settings })
  }

  return res.status(405).end()
}
