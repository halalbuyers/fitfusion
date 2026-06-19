import type { NextApiRequest, NextApiResponse } from 'next'
import AdminFeedback from '../../../models/AdminFeedback'
import AdminAnnouncement from '../../../models/AdminAnnouncement'
import AdminActivityLog from '../../../models/AdminActivityLog'
import Notification from '../../../models/Notification'
import { requireAdmin } from '../../../lib/admin/api'

const statusMap: Record<string, string> = {
  open: 'pending',
  resolved: 'completed',
  archived: 'rejected'
}

const allowedStatuses = ['pending', 'completed', 'published', 'rejected', 'open', 'resolved', 'archived']
const allowedPriorities = ['low', 'medium', 'high']
const allowedTypes = ['feedback', 'bug', 'feature']
const acceptedStatuses = ['completed', 'resolved', 'published']

function normalizeStatus(value: unknown) {
  const status = String(value || '').trim()
  return statusMap[status] || status
}

function feedbackUser(item: any) {
  return item.username || item.name || item.email?.split('@')[0] || 'Community'
}

function feedbackNotificationBody(feature: string) {
  return `Feature: ${feature}\n\nThank you for helping improve FitFusion.`
}

async function notifyFeedbackUser(userId: string | undefined, feature: string, type: 'feedback' | 'update') {
  if (!userId) return
  await Notification.create({
    userId,
    type,
    title: '🎉 Your feedback has been implemented!',
    body: feedbackNotificationBody(feature),
    read: false
  }).catch(() => null)
}

function serializeFeedback(item: any) {
  return {
    ...item,
    _id: item._id?.toString ? item._id.toString() : String(item._id),
    userId: item.userId || '',
    username: feedbackUser(item),
    name: item.name || feedbackUser(item),
    email: item.email || '',
    profileImage: item.profileImage || '',
    category: item.category || item.type || 'feedback',
    status: normalizeStatus(item.status) || 'pending'
  }
}

function buildQuery(req: NextApiRequest) {
  const query: Record<string, any> = {}
  const status = normalizeStatus(req.query.status)
  const priority = String(req.query.priority || '').trim()
  const search = String(req.query.search || req.query.q || '').trim()

  if (status && allowedStatuses.includes(status)) {
    if (status === 'pending') query.status = { $in: ['pending', 'open'] }
    else if (status === 'completed') query.status = { $in: ['completed', 'resolved'] }
    else if (status === 'rejected') query.status = { $in: ['rejected', 'archived'] }
    else query.status = status
  }
  if (priority && allowedPriorities.includes(priority)) query.priority = priority
  if (search) {
    const regex = { $regex: search, $options: 'i' }
    query.$or = [
      { username: regex },
      { name: regex },
      { email: regex },
      { userId: regex },
      { title: regex },
      { message: regex },
      { category: regex },
      { type: regex }
    ]
  }

  return query
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const sort = String(req.query.sort || 'newest')
    const sortQuery = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 }
    const feedback = await AdminFeedback.find(buildQuery(req)).sort(sortQuery as any).lean()
    if (sort === 'priority') {
      const rank: Record<string, number> = { high: 3, medium: 2, low: 1 }
      feedback.sort((a, b) => (rank[b.priority] || 0) - (rank[a.priority] || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    const contributors = await AdminFeedback.aggregate([
      { $match: { status: { $in: acceptedStatuses }, userId: { $exists: true, $ne: '' } } },
      { $sort: { updatedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          acceptedFeedbackCount: { $sum: 1 },
          username: { $first: '$username' },
          name: { $first: '$name' },
          email: { $first: '$email' },
          profileImage: { $first: '$profileImage' }
        }
      },
      { $sort: { acceptedFeedbackCount: -1, username: 1 } },
      { $limit: 10 }
    ]).catch(() => [])
    return res.status(200).json({
      feedback: feedback.map(serializeFeedback),
      contributors: contributors.map((item: any) => ({
        userId: item._id,
        username: feedbackUser(item),
        email: item.email || '',
        profileImage: item.profileImage || '',
        acceptedFeedbackCount: item.acceptedFeedbackCount || 0
      }))
    })
  }

  if (req.method === 'POST') {
    const body = req.body || {}
    const type = allowedTypes.includes(body.type) ? body.type : 'feedback'
    const priority = allowedPriorities.includes(body.priority) ? body.priority : 'medium'
    const status = allowedStatuses.includes(body.status) ? normalizeStatus(body.status) : 'pending'
    const feedback = await AdminFeedback.create({
      ...body,
      type,
      priority,
      status,
      category: body.category || type
    })
    return res.status(201).json({ feedback })
  }

  if (req.method === 'PATCH') {
    const { id, action, updatePayload, ...body } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const feedback = await AdminFeedback.findById(id)
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' })

    if (action === 'convert') {
      const source: any = feedback.toObject()
      const title = String(updatePayload?.title || source.title || '').trim()
      const bodyText = String(updatePayload?.description || updatePayload?.body || source.message || '').trim()
      if (!title || !bodyText) return res.status(400).json({ error: 'Update title and description are required' })

      const status = updatePayload?.published === false ? 'draft' : String(updatePayload?.status || 'published')
      const announcement = await AdminAnnouncement.create({
        title,
        body: bodyText,
        type: updatePayload?.type || (source.type === 'bug' ? 'bug_fix' : 'community'),
        status,
        audience: updatePayload?.audience || 'all',
        isActive: updatePayload?.published === false ? false : updatePayload?.isActive !== false,
        featured: updatePayload?.featured === true,
        pinned: updatePayload?.pinned === true,
        priority: Number(updatePayload?.priority || (source.priority === 'high' ? 10 : source.priority === 'medium' ? 5 : 1)),
        displayOrder: Number(updatePayload?.displayOrder || 0),
        credits: updatePayload?.credits || feedbackUser(source),
        releaseNotes: updatePayload?.releaseNotes || '',
        featuredImage: updatePayload?.featuredImage || '',
        suggestedByUserId: source.userId,
        suggestedByUsername: feedbackUser(source),
        creditedUserId: source.userId,
        creditedUsername: feedbackUser(source),
        publishedAt: status === 'published' ? new Date() : undefined,
        createdBy: admin.userId
      })

      const nextStatus = status === 'published' ? 'published' : 'completed'
      feedback.set({
        status: nextStatus,
        convertedUpdateId: String(announcement._id),
        adminNotes: body.adminNotes ?? feedback.adminNotes
      })
      await feedback.save()
      await notifyFeedbackUser(source.userId, title, 'update')
      await AdminActivityLog.create({
        userId: admin.userId,
        action: 'feedback_update',
        target: id,
        metadata: { action: 'convert', updateId: String(announcement._id), status: nextStatus }
      }).catch(() => null)
      return res.status(200).json({ ok: true, feedback, announcement })
    }

    const patch: Record<string, unknown> = {}
    for (const key of ['title', 'message', 'category', 'priority', 'reply', 'adminNotes', 'assignedTo'] as const) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    if (body.status !== undefined) patch.status = normalizeStatus(body.status)
    if (action === 'assign') patch.assignedTo = body.assignedTo || admin.userId
    if (action === 'complete') patch.status = 'completed'
    if (action === 'reject') patch.status = 'rejected'

    const updated = await AdminFeedback.findByIdAndUpdate(id, patch, { new: true })
    if (patch.status === 'completed' && normalizeStatus(feedback.status) !== 'completed') {
      await notifyFeedbackUser(feedback.userId, feedback.title, 'feedback')
    }
    await AdminActivityLog.create({ userId: admin.userId, action: 'feedback_update', target: id, metadata: { action, ...patch } }).catch(() => null)
    return res.status(200).json({ ok: true, feedback: updated })
  }

  if (req.method === 'DELETE') {
    const id = String(req.body?.id || req.query.id || '')
    if (!id) return res.status(400).json({ error: 'Missing id' })
    await AdminFeedback.findByIdAndDelete(id)
    await AdminActivityLog.create({ userId: admin.userId, action: 'feedback_update', target: id, metadata: { action: 'delete' } }).catch(() => null)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
