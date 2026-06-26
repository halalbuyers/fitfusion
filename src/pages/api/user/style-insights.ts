import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import OutfitFeedback from '../../../models/OutfitFeedback'
import { getPersonalizationProfile } from '../../../lib/personalization-engine'

function topList(rows: Array<{ _id: string; value: number }>) {
  return rows.map((row) => ({ name: row._id, value: row.value }))
}

async function topArrayField(userId: string, field: 'colors' | 'categories', positive = true) {
  const reactions = positive ? ['love_it', 'wear_again'] : ['not_my_style', 'never_suggest_again']
  return OutfitFeedback.aggregate([
    { $match: { userId, reaction: { $in: reactions } } },
    { $unwind: `$${field}` },
    { $match: { [field]: { $nin: [null, '', 'unknown', 'other'] } } },
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: 8 }
  ]).catch(() => [])
}

async function topScalarField(userId: string, field: 'style' | 'season' | 'occasion', positive = true) {
  const reactions = positive ? ['love_it', 'wear_again'] : ['not_my_style', 'never_suggest_again']
  return OutfitFeedback.aggregate([
    { $match: { userId, reaction: { $in: reactions }, [field]: { $nin: [null, '', 'unknown', 'other'] } } },
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: 8 }
  ]).catch(() => [])
}

async function outfitRanks(userId: string, positive = true) {
  const reactions = positive ? ['love_it', 'wear_again'] : ['not_my_style', 'never_suggest_again']
  return OutfitFeedback.aggregate([
    { $match: { userId, reaction: { $in: reactions } } },
    {
      $group: {
        _id: '$outfitKey',
        value: { $sum: { $cond: [{ $eq: ['$reaction', positive ? 'wear_again' : 'never_suggest_again'] }, 2, 1] } },
        occasion: { $last: '$occasion' },
        style: { $last: '$style' },
        season: { $last: '$season' },
        colors: { $last: '$colors' },
        categories: { $last: '$categories' },
        lastFeedbackAt: { $max: '$createdAt' }
      }
    },
    { $sort: { value: -1, lastFeedbackAt: -1 } },
    { $limit: 8 },
    {
      $project: {
        _id: 0,
        outfitKey: '$_id',
        score: '$value',
        occasion: 1,
        style: 1,
        season: 1,
        colors: 1,
        categories: 1,
        lastFeedbackAt: 1
      }
    }
  ]).catch(() => [])
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
    const [
      profile,
      lovedColors,
      lovedCategories,
      lovedStyles,
      lovedSeasons,
      rejectedColors,
      rejectedCategories,
      rejectedStyles,
      rejectedSeasons,
      mostLovedOutfits,
      leastLikedOutfits
    ] = await Promise.all([
      getPersonalizationProfile(userId),
      topArrayField(userId, 'colors', true),
      topArrayField(userId, 'categories', true),
      topScalarField(userId, 'style', true),
      topScalarField(userId, 'season', true),
      topArrayField(userId, 'colors', false),
      topArrayField(userId, 'categories', false),
      topScalarField(userId, 'style', false),
      topScalarField(userId, 'season', false),
      outfitRanks(userId, true),
      outfitRanks(userId, false)
    ])

    return res.status(200).json({
      favoriteColors: profile.favoriteColors,
      favoriteCategories: profile.favoriteCategories,
      favoriteStyles: profile.favoriteStyles,
      favoriteSeasons: profile.favoriteSeasons,
      rejectedColors: profile.dislikedColors,
      rejectedCategories: profile.dislikedCategories,
      rejectedStyles: profile.dislikedStyles,
      rejectedSeasons: profile.dislikedSeasons,
      feedbackTrends: {
        favoriteColors: topList(lovedColors),
        favoriteCategories: topList(lovedCategories),
        favoriteStyles: topList(lovedStyles),
        favoriteSeasons: topList(lovedSeasons),
        rejectedColors: topList(rejectedColors),
        rejectedCategories: topList(rejectedCategories),
        rejectedStyles: topList(rejectedStyles),
        rejectedSeasons: topList(rejectedSeasons)
      },
      mostLovedOutfits,
      leastLikedOutfits
    })
  } catch {
    return res.status(503).json({ error: 'Could not load style insights' })
  }
}
