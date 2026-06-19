import type { NextApiRequest, NextApiResponse } from 'next'
import { clerkClient } from '@clerk/nextjs/server'
import AdminFeedback from '../../../../models/AdminFeedback'
import Clothing from '../../../../models/Clothing'
import Outfit from '../../../../models/Outfit'
import Post from '../../../../models/Post'
import User from '../../../../models/User'
import { requireAdmin } from '../../../../lib/admin/api'

function asId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || ''
}

function displayName(user: any, clerkUser: any, fallbackId: string) {
  const clerkName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim()
  return clerkUser?.username || clerkName || user?.name || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || user?.email?.split('@')[0] || fallbackId
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return
  if (req.method !== 'GET') return res.status(405).end()

  const requestedId = asId(req.query.userId).trim()
  if (!requestedId) return res.status(400).json({ error: 'Missing userId' })

  const user = await User.findOne({
    $or: [{ clerkId: requestedId }, { _id: requestedId.match(/^[a-f\d]{24}$/i) ? requestedId : undefined }].filter((item) => Object.values(item)[0])
  }).lean().catch(() => null) as any

  const clerkId = user?.clerkId || requestedId
  const clerkUser = await clerkClient().then((client) => client.users.getUser(clerkId)).catch(() => null)
  const email = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || user?.email || ''
  const username = displayName(user, clerkUser, clerkId)
  const avatar = clerkUser?.imageUrl || user?.profilePhoto || ''

  const [
    feedbackSubmitted,
    acceptedFeedback,
    postsCreated,
    likesRows,
    outfitsGenerated,
    wardrobeItems
  ] = await Promise.all([
    AdminFeedback.countDocuments({ userId: clerkId }).catch(() => 0),
    AdminFeedback.countDocuments({ userId: clerkId, status: { $in: ['completed', 'resolved', 'published'] } }).catch(() => 0),
    Post.countDocuments({ userId: clerkId }).catch(() => 0),
    Post.aggregate([{ $match: { userId: clerkId } }, { $project: { value: { $size: { $ifNull: ['$likes', []] } } } }, { $group: { _id: null, value: { $sum: '$value' } } }]).catch(() => []),
    Outfit.countDocuments({ userId: clerkId }).catch(() => 0),
    Clothing.countDocuments({ userId: clerkId }).catch(() => 0)
  ])

  return res.status(200).json({
    user: {
      userId: clerkId,
      databaseId: user?._id ? String(user._id) : '',
      username,
      name: user?.name || username,
      email,
      avatar,
      role: user?.role || clerkUser?.publicMetadata?.role || 'user',
      joinedAt: user?.createdAt || clerkUser?.createdAt || null,
      lastActiveAt: user?.updatedAt || clerkUser?.updatedAt || null
    },
    stats: {
      feedbackSubmitted,
      acceptedFeedback,
      postsCreated,
      likesReceived: likesRows?.[0]?.value || 0,
      outfitsGenerated,
      wardrobeItems
    }
  })
}
