import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../lib/mongodb'
import AdminActivityLog from '../../models/AdminActivityLog'
import AdminFeedback from '../../models/AdminFeedback'
import User from '../../models/User'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
    const body = req.body || {}
    const title = String(body.title || '').trim()
    const message = String(body.message || '').trim()
    const type = ['feedback', 'bug', 'feature'].includes(body.type) ? body.type : 'feedback'
    const priority = ['low', 'medium', 'high'].includes(body.priority) ? body.priority : 'medium'

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' })
    }

    const profile = await User.findOne({ clerkId: userId }).lean().catch(() => null)
    const feedback = await AdminFeedback.create({
      userId,
      name: profile?.name,
      email: profile?.email,
      type,
      priority,
      title,
      message,
      status: 'open'
    })

    await AdminActivityLog.create({
      userId,
      userEmail: profile?.email,
      action: 'feedback_update',
      target: String(feedback._id),
      metadata: { submittedByUser: true, type, priority }
    }).catch(() => null)

    return res.status(201).json({ ok: true, feedback })
  } catch {
    return res.status(503).json({ error: 'Unable to submit feedback right now' })
  }
}
