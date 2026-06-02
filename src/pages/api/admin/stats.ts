import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import Outfit from '../../../models/Outfit'
import Post from '../../../models/Post'
import User from '../../../models/User'
import { isAdmin } from '../../../lib/auth/admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  if (!(await isAdmin(req))) return res.status(403).json({ error: 'Access Denied' })

  try {
    await connectToDatabase()
    const [users, clothing, outfits, posts, recentUsers, recentOutfits] = await Promise.all([
      User.countDocuments(),
      Clothing.countDocuments(),
      Outfit.countDocuments(),
      Post.countDocuments().catch(() => 0),
      User.find().sort({ createdAt: -1 }).limit(5).lean(),
      Outfit.find().sort({ createdAt: -1 }).limit(5).lean()
    ])

    return res.status(200).json({
      users,
      clothing,
      outfits,
      posts,
      recentUsers,
      recentOutfits,
      health: 'operational'
    })
  } catch {
    return res.status(200).json({
      users: 0,
      clothing: 0,
      outfits: 0,
      posts: 0,
      recentUsers: [],
      recentOutfits: [],
      health: 'database fallback'
    })
  }
}
