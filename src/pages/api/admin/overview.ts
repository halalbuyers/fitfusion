import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../../lib/admin/api'
import { getAdminOverview } from '../../../lib/admin/metrics'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    return res.status(200).json(await getAdminOverview())
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load admin overview' })
  }
}
