import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import mongoose from 'mongoose'
import FashionProfile from '../../../models/FashionProfile'
import { isAdmin } from '../../../lib/auth/admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    await mongoose.connect(process.env.MONGODB_URI || '')
    const { userId, sessionClaims } = getAuth(req)

    if (!userId || !(await isAdmin({ userId, sessionClaims }))) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const profiles = await FashionProfile.find({ hasCompletedOnboarding: true }).lean()

    const fashionTypeCounts = {
      menswear: profiles.filter(p => p.fashionType === 'menswear').length,
      womenswear: profiles.filter(p => p.fashionType === 'womenswear').length,
      both: profiles.filter(p => p.fashionType === 'both').length,
      'prefer-not-to-specify': profiles.filter(p => p.fashionType === 'prefer-not-to-specify').length
    }

    const styleCounts: Record<string, number> = {}
    const colorCounts: Record<string, number> = {}
    const occasionCounts: Record<string, number> = {}
    const goalCounts: Record<string, number> = {}

    profiles.forEach(p => {
      p.preferredStyles?.forEach(style => {
        styleCounts[style] = (styleCounts[style] || 0) + 1
      })
      p.favoriteColors?.forEach(color => {
        colorCounts[color] = (colorCounts[color] || 0) + 1
      })
      p.preferredOccasions?.forEach(occasion => {
        occasionCounts[occasion] = (occasionCounts[occasion] || 0) + 1
      })
      p.fashionGoals?.forEach(goal => {
        goalCounts[goal] = (goalCounts[goal] || 0) + 1
      })
    })

    return res.status(200).json({
      totalProfiles: profiles.length,
      fashionTypeCounts,
      topStyles: Object.entries(styleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([style, count]) => ({ name: style, value: count })),
      topColors: Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([color, count]) => ({ name: color, value: count })),
      topOccasions: Object.entries(occasionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([occasion, count]) => ({ name: occasion, value: count })),
      topGoals: Object.entries(goalCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7)
        .map(([goal, count]) => ({ name: goal, value: count }))
    })
  } catch (error) {
    console.error('Error fetching fashion profile analytics:', error)
    return res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
