import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import UserPreference from '../../../models/UserPreference'
import { buildPreferenceProfile } from '../../../lib/preference-engine'
import { getPersonalizationProfile } from '../../../lib/personalization-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  if (req.method === 'GET') {
    const [items, stored, personalization] = await Promise.all([
      Clothing.find({ userId }).lean(),
      UserPreference.findOne({ userId }).lean(),
      getPersonalizationProfile(userId).catch(() => null)
    ])
    const profile = buildPreferenceProfile(items as any, stored || undefined)
    return res.status(200).json({
      ...profile,
      favoriteColors: [...new Set([...profile.favoriteColors, ...(personalization?.favoriteColors || [])])],
      favoriteStyles: [...new Set([...profile.favoriteStyles, ...(personalization?.favoriteStyles || [])])],
      favoriteCategories: [...new Set([...profile.favoriteCategories, ...(personalization?.favoriteCategories || [])])],
      favoriteSeasons: [...new Set([...profile.favoriteSeasons, ...(personalization?.favoriteSeasons || [])])],
      preferredColors: [...new Set([...profile.preferredColors, ...(personalization?.favoriteColors || [])])],
      preferredStyles: [...new Set([...profile.preferredStyles, ...(personalization?.favoriteStyles || [])])]
    })
  }

  if (req.method === 'PATCH' || req.method === 'POST') {
    const allowed = [
      'favoriteColors',
      'favoriteCategories',
      'favoriteStyles',
      'favoriteSeasons',
      'likedOutfitKeys',
      'rejectedOutfitKeys',
      'preferredStyles',
      'preferredColors',
      'avoidedColors',
      'favoriteOccasions',
      'favoriteOutfitKeys'
    ]
    const update = allowed.reduce<Record<string, string[]>>((acc, key) => {
      if (Array.isArray(req.body?.[key])) acc[key] = req.body[key].map(String)
      return acc
    }, {})
    const addToSet: Record<string, any> = {}
    if (typeof req.body?.rejectOutfitKey === 'string') addToSet.rejectedOutfitKeys = req.body.rejectOutfitKey
    if (typeof req.body?.favoriteOutfitKey === 'string') {
      addToSet.favoriteOutfitKeys = req.body.favoriteOutfitKey
      addToSet.likedOutfitKeys = req.body.favoriteOutfitKey
    }
    if (typeof req.body?.likedOutfitKey === 'string') addToSet.likedOutfitKeys = req.body.likedOutfitKey
    const preferences = await UserPreference.findOneAndUpdate(
      { userId },
      { ...(Object.keys(update).length ? { $set: update } : {}), ...(Object.keys(addToSet).length ? { $addToSet: addToSet } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    return res.status(200).json(preferences)
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
