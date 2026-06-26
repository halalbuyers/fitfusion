import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import { recordStylistAdviceFeedback } from '../../../lib/personalization-engine'

const actions = ['liked', 'disliked'] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const action = String(req.body?.action || '')
  if (!actions.includes(action as any)) return res.status(400).json({ error: 'Invalid action' })

  try {
    await connectToDatabase()
    await recordStylistAdviceFeedback(userId, action as 'liked' | 'disliked', req.body?.topic || 'advice')
    return res.status(201).json({ ok: true })
  } catch {
    return res.status(503).json({ error: 'Could not record stylist feedback' })
  }
}
