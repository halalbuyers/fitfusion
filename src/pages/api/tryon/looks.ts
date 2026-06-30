import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import { getAuth } from '@clerk/nextjs/server'
import { generateOutfitsForUser } from '../../../ai/outfit'
import { connectToDatabase } from '../../../lib/mongodb'
import { compareTryOnLooks } from '../../../lib/tryon/comparisonEngine'
import { buildRenderSettings, buildTryOnRender } from '../../../lib/tryon/renderEngine'
import CalendarOutfit from '../../../models/CalendarOutfit'
import Clothing from '../../../models/Clothing'
import Outfit from '../../../models/Outfit'
import TryOnAvatar from '../../../models/TryOnAvatar'
import TryOnLook from '../../../models/TryOnLook'

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  res.setHeader('Vary', 'Cookie')
}

function parseDate(value: unknown) {
  const date = value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return null
  date.setHours(12, 0, 0, 0)
  return date
}

function isValidObjectId(value: unknown) {
  return mongoose.Types.ObjectId.isValid(String(value || ''))
}

async function createSavedOutfit(userId: string, outfit: any, plannedFor?: Date) {
  return Outfit.create({
    userId,
    title: outfit.title || 'Virtual try-on look',
    occasion: outfit.occasion || 'casual',
    items: (outfit.items || [])
      .map((item: any) => ({ clothing: item.id || item.clothing?._id || item.clothing, role: item.role }))
      .filter((item: any) => isValidObjectId(item.clothing)),
    score: outfit.score || 0,
    explanation: outfit.explanation,
    colorAnalysis: outfit.colorAnalysis,
    breakdown: outfit.breakdown || {},
    tags: outfit.tags || [],
    outfitKey: outfit.outfitKey,
    confidence: outfit.confidence,
    confidenceLabel: outfit.confidenceLabel,
    weatherMatch: outfit.weatherMatch,
    missingEssentials: outfit.missingEssentials,
    method: 'try-on',
    isFavorite: true,
    plannedFor
  })
}

async function renderLooks(userId: string, body: any) {
  const avatar = await TryOnAvatar.findOne({ _id: String(body.avatarId || ''), userId }).lean()
  if (!avatar) throw new Error('Create or select an avatar before rendering looks.')

  const settings = buildRenderSettings(body.settings || body)
  const [wardrobe, outfits] = await Promise.all([
    Clothing.find({ userId }).limit(1000).lean(),
    generateOutfitsForUser(userId, {
      occasion: settings.occasion,
      weather: settings.weather,
      season: settings.styleVariation === 'winter' ? 'winter' : settings.styleVariation === 'summer' ? 'summer' : undefined,
      preferences: [settings.styleVariation],
      limit: Number(body.limit || 8)
    })
  ])
  const clothingById = new Map((wardrobe as any[]).map((item) => [String(item._id), item]))
  const selectedOutfits = Array.isArray(body.outfits) && body.outfits.length ? body.outfits : outfits
  if (!selectedOutfits.length) throw new Error('Add enough wardrobe items to generate a try-on look.')

  const looks = []
  for (const outfit of selectedOutfits.slice(0, Math.min(12, Number(body.limit || 8)))) {
    const enriched = {
      ...outfit,
      title: outfit.title || `${settings.styleVariation} ${settings.occasion} look`,
      occasion: outfit.occasion || settings.occasion,
      items: (outfit.items || []).map((entry: any) => ({
        ...entry,
        clothing: entry.clothing || clothingById.get(String(entry.id || entry.clothing?._id || ''))
      }))
    }
    const render = buildTryOnRender({ userId, avatar, outfit: enriched, clothingById, settings })
    const look = await TryOnLook.findOneAndUpdate(
      { userId, cacheKey: render.cacheKey },
      { userId, avatarId: avatar._id, ...render, status: 'complete', error: '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    looks.push(look)
  }
  return looks
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res)
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch {
    if (req.method === 'GET') return res.status(200).json([])
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  try {
    if (req.method === 'GET') {
      const looks = await TryOnLook.find({ userId }).sort({ updatedAt: -1 }).limit(80).lean()
      return res.status(200).json(looks)
    }

    if (req.method === 'POST') {
      const action = String(req.body?.action || 'render')
      if (action === 'compare') {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : []
        const looks = await TryOnLook.find({ userId, _id: { $in: ids } }).lean()
        return res.status(200).json(compareTryOnLooks(looks as any[]))
      }
      if (action === 'schedule') {
        const look = await TryOnLook.findOne({ _id: String(req.body?.id || ''), userId }).lean()
        if (!look) return res.status(404).json({ error: 'Try-on look not found' })
        const date = parseDate(req.body?.date)
        if (!date) return res.status(400).json({ error: 'A valid schedule date is required' })
        const outfit = await createSavedOutfit(userId, look.outfitSnapshot, date)
        const plan = await CalendarOutfit.create({
          userId,
          date,
          outfitId: outfit._id,
          occasion: look.occasion,
          notes: `Scheduled from Virtual Try-On Studio: ${look.title}`,
          status: 'planned'
        })
        return res.status(201).json({ outfit, plan })
      }
      if (action === 'save') {
        const look = await TryOnLook.findOne({ _id: String(req.body?.id || ''), userId })
        if (!look) return res.status(404).json({ error: 'Try-on look not found' })
        look.favorite = true
        await look.save()
        const outfit = await createSavedOutfit(userId, look.outfitSnapshot)
        return res.status(201).json({ look, outfit })
      }

      const looks = await renderLooks(userId, req.body || {})
      return res.status(201).json(looks)
    }

    if (req.method === 'PATCH') {
      const look = await TryOnLook.findOne({ _id: String(req.body?.id || ''), userId })
      if (!look) return res.status(404).json({ error: 'Try-on look not found' })
      if (typeof req.body.favorite === 'boolean') look.favorite = req.body.favorite
      if (req.body.action === 'retry') {
        look.status = 'complete'
        look.error = ''
      }
      if (typeof req.body.appliedSuggestion === 'string') {
        look.settings = { ...(look.settings || {}), appliedSuggestion: req.body.appliedSuggestion }
        look.suggestions = (look.suggestions || []).map((item: any) => ({ ...item, active: item.id === req.body.appliedSuggestion }))
      }
      await look.save()
      return res.status(200).json(look)
    }

    const deleted = await TryOnLook.findOneAndDelete({ _id: String(req.query.id || ''), userId })
    if (!deleted) return res.status(404).json({ error: 'Try-on look not found' })
    return res.status(200).json({ ok: true })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Could not process try-on looks' })
  }
}
