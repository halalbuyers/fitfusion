import type { NextApiRequest, NextApiResponse } from 'next'
import AdminAnnouncement from '../../../models/AdminAnnouncement'
import Notification from '../../../models/Notification'
import { requireAdmin } from '../../../lib/admin/api'

const allowedTypes = ['announcement', 'maintenance', 'feature', 'update', 'fix', 'bug_fix', 'community', 'improvement', 'security']
const allowedStatuses = ['draft', 'published', 'archived']

function implementedNotificationBody(feature: string) {
  return `Feature: ${feature}\n\nThank you for helping improve FitFusion.`
}

function normalizePayload(body: any, adminUserId?: string) {
  const status = allowedStatuses.includes(body?.status) ? body.status : body?.published === false ? 'draft' : 'published'
  const published = body?.published !== undefined ? Boolean(body.published) : status === 'published'
  const creditedUsername = body?.creditedUsername || body?.suggestedByUsername || body?.credits

  return {
    ...body,
    body: body?.description || body?.body,
    type: allowedTypes.includes(body?.type) ? body.type : 'improvement',
    status,
    audience: body?.audience || 'all',
    createdBy: adminUserId || body?.createdBy,
    isActive: body?.isActive !== undefined ? Boolean(body.isActive) : published,
    featured: body?.featured === true,
    pinned: body?.pinned === true,
    priority: Number(body?.priority || 0),
    displayOrder: Number(body?.displayOrder || 0),
    creditedUserId: body?.creditedUserId || body?.suggestedByUserId,
    creditedUsername,
    suggestedByUserId: body?.suggestedByUserId || body?.creditedUserId,
    suggestedByUsername: body?.suggestedByUsername || creditedUsername,
    credits: body?.credits || creditedUsername,
    releaseNotes: body?.releaseNotes || '',
    featuredImage: body?.featuredImage || '',
    publishedAt: status === 'published' ? body?.publishedAt || new Date() : body?.publishedAt
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const status = String(req.query.status || '')
    const query = allowedStatuses.includes(status) ? { status } : {}
    const announcements = await AdminAnnouncement.find(query).sort({ pinned: -1, featured: -1, displayOrder: 1, priority: -1, createdAt: -1 }).lean()
    return res.status(200).json({ announcements })
  }

  if (req.method === 'POST') {
    try {
      const announcement = await AdminAnnouncement.create(normalizePayload(req.body || {}, admin.userId))
      if (announcement.status === 'published' && announcement.creditedUserId) {
        await Notification.create({
          userId: announcement.creditedUserId,
          type: 'update',
          title: '🎉 Your feedback has been implemented!',
          body: implementedNotificationBody(announcement.title),
          read: false
        }).catch(() => null)
      }
      return res.status(201).json({ announcement })
    } catch {
      return res.status(400).json({ error: 'Invalid announcement payload' })
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { id, description, ...update } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    if (description && !update.body) update.body = description
    if (update.type && !allowedTypes.includes(String(update.type))) delete update.type
    if (update.status && !allowedStatuses.includes(String(update.status))) delete update.status
    if (update.published !== undefined) {
      update.status = update.published ? 'published' : 'draft'
      update.isActive = Boolean(update.published)
    }
    if (update.status === 'published' && update.publishedAt === undefined) update.publishedAt = new Date()
    if (update.priority !== undefined) update.priority = Number(update.priority || 0)
    if (update.displayOrder !== undefined) update.displayOrder = Number(update.displayOrder || 0)
    const existing = await AdminAnnouncement.findById(id)
    if (!existing) return res.status(404).json({ error: 'Announcement not found' })
    const wasPublished = existing.status === 'published' && existing.isActive !== false
    const announcement = await AdminAnnouncement.findByIdAndUpdate(id, update, { new: true })
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' })
    const isNowPublished = announcement.status === 'published' && announcement.isActive !== false
    if (!wasPublished && isNowPublished && announcement.creditedUserId) {
      await Notification.create({
        userId: announcement.creditedUserId,
        type: 'update',
        title: '🎉 Your feedback has been implemented!',
        body: implementedNotificationBody(announcement.title),
        read: false
      }).catch(() => null)
    }
    return res.status(200).json({ ok: true, announcement })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    await AdminAnnouncement.findByIdAndDelete(id)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
