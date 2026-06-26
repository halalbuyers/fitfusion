import type { NextApiRequest, NextApiResponse } from 'next'
import User from '../../../models/User'
import Clothing from '../../../models/Clothing'
import Outfit from '../../../models/Outfit'
import AiRequestLog from '../../../models/AiRequestLog'
import { requireAdmin } from '../../../lib/admin/api'

function csv(rows: Array<Record<string, unknown>>) {
  const headers = Object.keys(rows[0] || { metric: '', value: '' })
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const [users, wardrobe, outfits, aiUsage] = await Promise.all([
    User.countDocuments(),
    Clothing.countDocuments(),
    Outfit.countDocuments(),
    AiRequestLog.countDocuments().catch(() => 0)
  ])
  const rows = [
    { metric: 'User Growth', value: users },
    { metric: 'Wardrobe Growth', value: wardrobe },
    { metric: 'Outfit Usage', value: outfits },
    { metric: 'AI Usage', value: aiUsage }
  ]
  const format = String(req.query.format || 'csv')
  const body = csv(rows)
  res.setHeader('Content-Disposition', `attachment; filename="noir-closet-admin-report.${format === 'excel' ? 'xls' : 'csv'}"`)
  res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv')
  return res.status(200).send(body)
}
