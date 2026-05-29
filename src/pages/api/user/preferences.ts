import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import UserPreference from '../../../models/UserPreference'
import { buildPreferenceProfile } from '../../../lib/preference-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  if (req.method === 'GET') {
    const [items, stored] = await Promise.all([
      Clothing.find({ userId }).lean(),
      UserPreference.findOne({ userId }).lean()
    ])
    return res.status(200).json(buildPreferenceProfile(items as any, stored || undefined))
  }

  if (req.method === 'PATCH' || req.method === 'POST') {
    const allowed = ['preferredStyles', 'preferredColors', 'avoidedColors', 'favoriteCategories', 'rejectedOutfitKeys', 'favoriteOutfitKeys']
    const update = allowed.reduce<Record<string, string[]>>((acc, key) => {
      if (Array.isArray(req.body?.[key])) acc[key] = req.body[key].map(String)
      return acc
    }, {})
    const addToSet: Record<string, any> = {}
    if (typeof req.body?.rejectOutfitKey === 'string') addToSet.rejectedOutfitKeys = req.body.rejectOutfitKey
    if (typeof req.body?.favoriteOutfitKey === 'string') addToSet.favoriteOutfitKeys = req.body.favoriteOutfitKey
    const preferences = await UserPreference.findOneAndUpdate(
      { userId },
      { ...(Object.keys(update).length ? { $set: update } : {}), ...(Object.keys(addToSet).length ? { $addToSet: addToSet } : {}) },
      { upsert: true, new: true }
    )
    return res.status(200).json(preferences)
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
