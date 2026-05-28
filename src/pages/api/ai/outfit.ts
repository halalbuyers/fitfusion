import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { generateOutfitsForUser } from '../../../ai/outfit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end()

    const { userId } = getAuth(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { occasion, weather, preferences } = req.body
    const outfits = await generateOutfitsForUser(userId, { occasion, weather, preferences })
    return res.status(200).json({ outfits })
  } catch {
    return res.status(500).json({ error: 'Could not generate outfits right now.' })
  }
}
