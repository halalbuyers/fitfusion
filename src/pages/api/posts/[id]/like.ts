import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../../lib/mongodb'
import Post from '../../../../models/Post'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end()
    await connectToDatabase()
    const { userId } = getAuth(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const post = await Post.findById(req.query.id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (post.likesEnabled === false) return res.status(403).json({ error: 'Likes are disabled for this post.' })
    post.likes = post.likes.includes(userId) ? post.likes.filter((id: string) => id !== userId) : [...post.likes, userId]
    await post.save()
    return res.status(200).json(post)
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('ECONNREFUSED') || message.includes('querySrv') || message.includes('MONGODB_URI')) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
    }
    return res.status(500).json({ error: 'Failed to update like.' })
  }
}
