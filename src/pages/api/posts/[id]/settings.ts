import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../../lib/mongodb'
import Post from '../../../../models/Post'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PATCH') return res.status(405).end()
    await connectToDatabase()
    const { userId } = getAuth(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const post = await Post.findById(req.query.id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (post.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const body = req.body || {}
    const updates: any = {}

    if (typeof body.status === 'string') updates.status = ['published', 'draft', 'archived'].includes(body.status) ? body.status : post.status
    if (typeof body.visibility === 'string') updates.visibility = ['public', 'followers', 'private'].includes(body.visibility) ? body.visibility : post.visibility
    if (typeof body.pinned === 'boolean') updates.pinned = body.pinned
    if (typeof body.hidden === 'boolean') updates.hidden = body.hidden
    if (typeof body.commentsEnabled === 'boolean') updates.commentsEnabled = body.commentsEnabled
    if (typeof body.likesEnabled === 'boolean') updates.likesEnabled = body.likesEnabled
    if (typeof body.title === 'string') updates.title = body.title
    if (typeof body.caption === 'string') updates.caption = body.caption
    if (typeof body.location === 'string') updates.location = body.location
    if (typeof body.occasion === 'string') updates.occasion = body.occasion
    if (typeof body.style === 'string') updates.style = body.style
    if (typeof body.season === 'string') updates.season = body.season
    if (Array.isArray(body.hashtags)) updates.hashtags = body.hashtags.map(String).filter(Boolean)
    if (Array.isArray(body.tags)) updates.tags = body.tags.map(String).filter(Boolean)
    if (typeof body.videoUrl === 'string') updates.videoUrl = body.videoUrl
    if (typeof body.videoThumbnail === 'string') updates.videoThumbnail = body.videoThumbnail

    Object.assign(post, updates)
    await post.save()
    return res.status(200).json(post)
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('ECONNREFUSED') || message.includes('querySrv') || message.includes('MONGODB_URI')) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
    }
    return res.status(500).json({ error: 'Failed to update post settings.' })
  }
}
