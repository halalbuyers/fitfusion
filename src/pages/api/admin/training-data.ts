import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../../lib/admin/api'
import { getTrainingAnalytics } from '../../../lib/training-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const admin = await requireAdmin(req, res)
  if (!admin) return
  return res.status(200).json(await getTrainingAnalytics())
}
