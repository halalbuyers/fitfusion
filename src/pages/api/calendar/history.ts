import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import CalendarOutfit from '../../../models/CalendarOutfit'
import Clothing from '../../../models/Clothing'

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  res.setHeader('Vary', 'Cookie')
}

function itemProjection() {
  return 'image category primaryColor color colors style wearCount usageCount lastWornAt itemPreferenceScore'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res)

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch {
    return res.status(200).json({ mostWorn: [], leastWorn: [], lastWorn: [], statusCounts: {} })
  }

  const [mostWorn, leastWorn, lastWorn, statusCounts] = await Promise.all([
    Clothing.find({ userId, $or: [{ wearCount: { $gt: 0 } }, { usageCount: { $gt: 0 } }] })
      .select(itemProjection())
      .sort({ wearCount: -1, usageCount: -1, lastWornAt: -1 })
      .limit(5)
      .lean()
      .catch(() => []),
    Clothing.find({ userId })
      .select(itemProjection())
      .sort({ wearCount: 1, usageCount: 1, createdAt: 1 })
      .limit(5)
      .lean()
      .catch(() => []),
    Clothing.find({ userId, lastWornAt: { $ne: null } })
      .select(itemProjection())
      .sort({ lastWornAt: -1 })
      .limit(5)
      .lean()
      .catch(() => []),
    CalendarOutfit.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).catch(() => [])
  ])

  const counts = (statusCounts as Array<{ _id: string; count: number }>).reduce<Record<string, number>>((acc, row) => {
    acc[row._id || 'planned'] = row.count
    return acc
  }, {})

  return res.status(200).json({ mostWorn, leastWorn, lastWorn, statusCounts: counts })
}
