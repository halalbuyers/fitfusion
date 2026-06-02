import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import { recordOutfitInteraction } from '../../../lib/learning-engine'

const actions = ['liked', 'saved', 'rejected', 'worn', 'favorited']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { outfitId, outfitKey, action, outfit } = req.body || {}
  if (!actions.includes(action)) return res.status(400).json({ error: 'Invalid action' })
  if (!outfitId && !outfitKey && !outfit?.outfitKey) return res.status(400).json({ error: 'Outfit reference is required' })

  try {
    await connectToDatabase()
    await recordOutfitInteraction({ userId, outfitId, outfitKey: outfitKey || outfit?.outfitKey, action, outfit })
    return res.status(201).json({ ok: true })
  } catch {
    return res.status(503).json({ error: 'Could not record outfit interaction' })
  }
}
