import type { NextApiRequest, NextApiResponse } from 'next'
import { clerkClient } from '@clerk/nextjs/server'
import User from '../../../models/User'
import Clothing from '../../../models/Clothing'
import Outfit from '../../../models/Outfit'
import AdminActivityLog from '../../../models/AdminActivityLog'
import { getClientIp, requireAdmin } from '../../../lib/admin/api'

const roles = ['user', 'moderator', 'admin']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const search = String(req.query.search || '').trim()
    const role = String(req.query.role || '')
    const sort = String(req.query.sort || 'createdAt')
    const direction = String(req.query.direction || 'desc') === 'asc' ? 1 : -1
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 12)))
    const query: Record<string, unknown> = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (roles.includes(role)) query.role = role

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort({ [sort]: direction }).skip((page - 1) * limit).limit(limit).lean()
    ])
    const userIds = users.map((user) => user.clerkId || String(user._id))
    const [wardrobeCounts, outfitCounts] = await Promise.all([
      Clothing.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', value: { $sum: 1 } } }]),
      Outfit.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', value: { $sum: 1 } } }])
    ])
    const wardrobeMap = new Map(wardrobeCounts.map((row) => [row._id, row.value]))
    const outfitMap = new Map(outfitCounts.map((row) => [row._id, row.value]))
    const clerkImageMap = new Map<string, string>()
    const client = await clerkClient().catch(() => null)
    if (client) {
      const clerkUsers = await Promise.all(users.map((user) => user.clerkId ? client.users.getUser(user.clerkId).catch(() => null) : Promise.resolve(null)))
      clerkUsers.forEach((clerkUser) => {
        if (clerkUser?.id) clerkImageMap.set(clerkUser.id, clerkUser.imageUrl || '')
      })
    }

    return res.status(200).json({
      total,
      page,
      limit,
      users: users.map((user) => {
        const id = user.clerkId || String(user._id)
        return {
          _id: String(user._id),
          clerkId: user.clerkId,
          avatar: (user.clerkId && clerkImageMap.get(user.clerkId)) || user.profilePhoto || '',
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          wardrobeCount: wardrobeMap.get(id) || 0,
          outfitCount: outfitMap.get(id) || 0,
          createdAt: user.createdAt,
          lastLogin: user.updatedAt
        }
      })
    })
  }

  if (req.method === 'PATCH') {
    const { userId, role, suspended } = req.body || {}
    if (!userId) return res.status(400).json({ error: 'Missing userId' })
    if (role && !roles.includes(role)) return res.status(400).json({ error: 'Invalid role' })

    const user = await User.findByIdAndUpdate(
      userId,
      role ? { role } : {},
      { new: true }
    )
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (user.clerkId && (role || typeof suspended === 'boolean')) {
      const client = await clerkClient()
      await client.users.updateUserMetadata(user.clerkId, {
        publicMetadata: {
          role: role || user.role,
          suspended: typeof suspended === 'boolean' ? suspended : undefined
        }
      })
    }

    await AdminActivityLog.create({
      userId: admin.userId,
      action: 'role_change',
      target: user.email,
      ip: getClientIp(req),
      metadata: { role, suspended }
    })
    return res.status(200).json({ ok: true, user })
  }

  if (req.method === 'DELETE') {
    const userId = String(req.query.userId || '')
    if (!userId) return res.status(400).json({ error: 'Missing userId' })
    const user = await User.findByIdAndDelete(userId)
    if (user?.clerkId) {
      const client = await clerkClient()
      await client.users.deleteUser(user.clerkId).catch(() => null)
    }
    await AdminActivityLog.create({ userId: admin.userId, action: 'admin_action', target: user?.email || userId, ip: getClientIp(req), metadata: { deletedUser: true } })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
