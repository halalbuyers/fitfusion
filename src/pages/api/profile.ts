import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../lib/mongodb'
import User from '../../models/User'
import { parseTags } from '../../lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch {
    if (req.method === 'GET') return res.status(200).json(null)
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  if (req.method === 'GET') {
    const profile = await User.findOne({ clerkId: userId }).lean()
    return res.status(200).json(profile)
  }

  if (req.method === 'PUT') {
    const body = req.body || {}
    const email = String(body.email || `${userId}@noircloset.local`)
    const profile = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        clerkId: userId,
        name: String(body.name || 'Noir Closet User'),
        email,
        profilePhoto: String(body.profilePhoto || ''),
        coverPhoto: String(body.coverPhoto || ''),
        bio: String(body.bio || ''),
        website: String(body.website || ''),
        styleType: String(body.styleType || ''),
        favoriteBrands: parseTags(body.favoriteBrands),
        age: body.age ? Number(body.age) : undefined,
        gender: String(body.gender || ''),
        stylePreferences: parseTags(body.stylePreferences),
        favoriteColors: parseTags(body.favoriteColors),
        sizes: {
          top: String(body.topSize || ''),
          bottom: String(body.bottomSize || ''),
          shoe: String(body.shoeSize || '')
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    return res.status(200).json(profile)
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
