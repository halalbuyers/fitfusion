import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import mongoose from 'mongoose'
import FashionProfile from '../../models/FashionProfile'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '')
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      let profile = await FashionProfile.findOne({ userId })

      if (!profile) {
        profile = new FashionProfile({
          userId,
          fashionType: 'prefer-not-to-specify',
          hasCompletedOnboarding: false
        })
        await profile.save()
      }

      return res.status(200).json(profile)
    }

    if (req.method === 'POST') {
      const {
        fashionType,
        preferredStyles,
        preferredCategories,
        favoriteColors,
        dislikedColors,
        preferredOccasions,
        climatePreference,
        fashionGoals
      } = req.body || {}

      if (!fashionType) {
        return res.status(400).json({ error: 'Fashion type is required' })
      }

      let profile = await FashionProfile.findOne({ userId })

      if (profile) {
        profile.fashionType = fashionType
        profile.preferredStyles = preferredStyles || profile.preferredStyles
        profile.preferredCategories = preferredCategories || profile.preferredCategories
        profile.favoriteColors = favoriteColors || profile.favoriteColors
        profile.dislikedColors = dislikedColors || profile.dislikedColors
        profile.preferredOccasions = preferredOccasions || profile.preferredOccasions
        profile.climatePreference = climatePreference || profile.climatePreference
        profile.fashionGoals = fashionGoals || profile.fashionGoals
        profile.hasCompletedOnboarding = true
      } else {
        profile = new FashionProfile({
          userId,
          fashionType,
          preferredStyles: preferredStyles || [],
          preferredCategories: preferredCategories || [],
          favoriteColors: favoriteColors || [],
          dislikedColors: dislikedColors || [],
          preferredOccasions: preferredOccasions || [],
          climatePreference: climatePreference || '',
          fashionGoals: fashionGoals || [],
          hasCompletedOnboarding: true
        })
      }

      await profile.save()

      return res.status(200).json({ success: true, profile })
    }

    if (req.method === 'PUT') {
      const body = req.body || {}
      let profile = await FashionProfile.findOne({ userId })

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' })
      }

      Object.assign(profile, body, { userId })
      await profile.save()

      return res.status(200).json({ success: true, profile })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Fashion profile API error:', error)
    return res.status(500).json({ error: 'Failed to process fashion profile request' })
  }
}
