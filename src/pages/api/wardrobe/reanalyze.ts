import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import FashionProfile from '../../../models/FashionProfile'
import { normalizeCategory } from '../../../lib/fashion-analysis'
import { isCategoryAllowedForFashionType, sanitizeCategoryForFashionType } from '../../../lib/outfit-engine-profile'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const auth = getAuth(req)
  const userId = auth.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch (error) {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  const profile = await FashionProfile.findOne({ userId })
  if (!profile) return res.status(400).json({ error: 'Fashion profile not found' })

  const items = await Clothing.find({ userId })
  let updatedCount = 0
  let resetCount = 0

  await Promise.all(items.map(async (item) => {
    const currentCategory = normalizeCategory(item.category)
    if (isCategoryAllowedForFashionType(currentCategory, profile.fashionType)) return

    const fallbackCategory = sanitizeCategoryForFashionType(item.aiCategory || item.category, profile.fashionType)
    const newCategory = fallbackCategory !== 'unknown' ? fallbackCategory : 'unknown'

    if (newCategory !== currentCategory) {
      item.category = newCategory
      await item.save()
      updatedCount += 1
      if (newCategory === 'unknown') resetCount += 1
    }
  }))

  return res.status(200).json({
    success: true,
    reanalyzed: items.length,
    updated: updatedCount,
    resetToUnknown: resetCount,
    fashionType: profile.fashionType
  })
}
