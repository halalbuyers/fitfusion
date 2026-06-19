import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Post from '../../../models/Post'
import Outfit from '../../../models/Outfit'
import User from '../../../models/User'
import FashionProfile from '../../../models/FashionProfile'
import { parseTags } from '../../../lib/api'

const normalizeText = (value: unknown) => String(value || '').trim()

function computeTrendingScore(post: any) {
  const likes = post.likes?.length || 0
  const saves = post.saves?.length || 0
  const views = post.metrics?.views || 0
  const shares = post.metrics?.shares || 0
  const comments = post.metrics?.comments || 0
  return likes * 1.3 + saves * 1.1 + shares * 1.4 + comments * 1.6 + views * 0.02
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
    const { userId } = getAuth(req)

    if (req.method === 'GET') {
      const feed = String(req.query.feed || 'home')
      const search = String(req.query.search || '').trim()
      const postType = String(req.query.type || '').trim()
      const query: any = { hidden: false, status: 'published' }

      if (postType) query.type = postType
      if (search) {
        const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(sanitized, 'i')
        query.$or = [
          { caption: regex },
          { title: regex },
          { hashtags: regex },
          { tags: regex },
          { location: regex },
          { occasion: regex },
          { style: regex },
          { season: regex }
        ]
      }

      let posts: Array<any> = []
      try {
        // Ensure the referenced model is registered before populate runs in serverless bundles.
        void Outfit
        posts = await Post.find(query).populate({
          path: 'outfit',
          populate: { path: 'items.clothing' }
        }).lean() as Array<any>
      } catch {
        posts = await Post.find(query).lean() as Array<any>
      }

      // Get user's fashion profile if authenticated
      let fashionProfile: any = null
      if (userId) {
        fashionProfile = await FashionProfile.findOne({ userId }).lean().catch(() => null)
      }

      // Filter posts based on fashion profile
      if (fashionProfile && fashionProfile.fashionType) {
        const fashionType = fashionProfile.fashionType
        // Filter posts based on user's fashion type
        posts = posts.filter((post: any) => {
          // If post has womenswear indicators
          if (['dress', 'skirt', 'blouse', 'heel', 'handbag', 'kurtis', 'saree'].some((cat) => 
            String(post.style).includes(cat) || String(post.occasion).includes(cat))) {
            return fashionType === 'womenswear' || fashionType === 'both'
          }
          // If post has menswear indicators  
          if (['tshirt', 'cargo', 'sneaker', 'streetwear'].some((cat) => 
            String(post.style).toLowerCase().includes(cat))) {
            return fashionType === 'menswear' || fashionType === 'both'
          }
          // Neutral posts for everyone
          return true
        })
      }

      if (feed === 'trending') {
        posts = posts.sort((a, b) => computeTrendingScore(b) - computeTrendingScore(a))
      } else if (feed === 'fashion') {
        posts = posts.filter((post) => ['outfit', 'wardrobe', 'style-tip', 'before-after'].includes(post.type) || post.style || post.season || post.occasion)
      }

      posts = posts.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }).slice(0, 50)

      return res.status(200).json(posts)
    }

    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'POST') {
      const body = req.body || {}
      const images = Array.isArray(body.images) ? body.images.filter(Boolean).map(String) : []
      const hashtags = parseTags(body.hashtags || body.tags || '')
      const tags = parseTags(body.tags || body.hashtags || '')
      const profile = await User.findOne({ clerkId: userId }).lean() as any

      const post = await Post.create({
        userId,
        author: {
          id: userId,
          name: profile?.name || 'FitFusion creator',
          avatar: profile?.profilePhoto || '',
          handle: profile?.name ? profile.name.toLowerCase().replace(/\s+/g, '') : `fitfusion-${userId.slice(-6)}`
        },
        type: ['image', 'carousel', 'video', 'outfit', 'wardrobe', 'style-tip', 'discussion', 'poll', 'before-after'].includes(normalizeText(body.type)) ? normalizeText(body.type) : 'outfit',
        title: normalizeText(body.title),
        caption: normalizeText(body.caption),
        hashtags,
        tags,
        location: normalizeText(body.location),
        occasion: normalizeText(body.occasion),
        style: normalizeText(body.style),
        season: normalizeText(body.season),
        visibility: ['public', 'followers', 'private'].includes(normalizeText(body.visibility)) ? normalizeText(body.visibility) : 'public',
        status: normalizeText(body.status) === 'draft' ? 'draft' : 'published',
        pinned: Boolean(body.pinned),
        hidden: Boolean(body.hidden),
        commentsEnabled: body.commentsEnabled !== false,
        likesEnabled: body.likesEnabled !== false,
        images,
        videoUrl: normalizeText(body.videoUrl),
        videoThumbnail: normalizeText(body.videoThumbnail),
        outfit: body.outfit || undefined
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
    if (req.method === 'GET') return res.status(200).json([])
    return res.status(500).json({ error: 'Failed to process posts request.' })
  }
}
