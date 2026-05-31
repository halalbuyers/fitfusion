import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Post from '../../../models/Post'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
    const { userId } = getAuth(req)

    if (req.method === 'GET') {
      const posts = await Post.find({}).populate({
        path: 'outfit',
        populate: { path: 'items.clothing' }
      }).sort({ createdAt: -1 }).limit(50)
      return res.status(200).json(posts)
    }

    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'POST') {
      const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean).map(String) : []
      const tags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean).map(String) : []
      const post = await Post.create({
        outfit: req.body.outfit || undefined,
        caption: String(req.body.caption || ''),
        images,
        tags,
        userId
      })
      return res.status(201).json(post)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('ECONNREFUSED') || message.includes('querySrv') || message.includes('MONGODB_URI')) {
      if (req.method === 'GET') return res.status(200).json([])
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
    }
    return res.status(500).json({ error: 'Failed to process posts request.' })
  }
}
