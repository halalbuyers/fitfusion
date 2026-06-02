import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { generateOutfitsForUser } from '../../../ai/outfit'
import { connectToDatabase } from '../../../lib/mongodb'
import AiRequestLog from '../../../models/AiRequestLog'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const started = Date.now()
    const source = req.method === 'GET' ? req.query : req.body || {}
    const outfits = await generateOutfitsForUser(userId, {
      occasion: String(source.occasion || 'casual'),
      weather: typeof source.weather === 'string' ? source.weather : undefined,
      temperature: source.temperature !== undefined ? Number(source.temperature) : undefined,
      mode: 'basic',
      limit: source.limit !== undefined ? Number(source.limit) : 6
    })
    await connectToDatabase().then(() => AiRequestLog.create({
      userId,
      kind: 'outfit',
      provider: 'local',
      status: 'success',
      responseTimeMs: Date.now() - started
    })).catch(() => null)
    return res.status(200).json({ outfits })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Could not recommend outfits' })
  }
}
