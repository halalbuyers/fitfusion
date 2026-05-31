import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { generateOutfitsForUser } from '../../../ai/outfit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { occasion, weather, temperature, season, preferences, mode = 'basic', limit } = req.body || {}
    const outfits = await generateOutfitsForUser(userId, { occasion, weather, temperature, season, preferences, mode, limit })
    return res.status(200).json({ outfits })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Could not generate outfits' })
  }
}
