import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import { getAiStyleProfile, getPersonalizationScore } from '../../../lib/personalization-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    await connectToDatabase()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  try {
    const profile = await getAiStyleProfile(userId)
    return res.status(200).json(profile)
  } catch {
    const personalizationScore = await getPersonalizationScore(userId).catch(() => 0)
    return res.status(200).json({
      personalizationScore,
      message: `AI understands your style: ${personalizationScore}%`,
      favoriteColors: [],
      favoriteCategories: [],
      favoriteStyles: [],
      mostWornItems: [],
      leastWornItems: [],
      seasonPreference: [],
      corrections: { categories: [], colors: [] }
    })
  }
}
