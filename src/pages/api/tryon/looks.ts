import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import { getAuth } from '@clerk/nextjs/server'
import { generateOutfitsForUser } from '../../../ai/outfit'
import { apiFail, apiOk } from '../../../lib/api'
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
    return apiFail(res, `Method ${req.method} Not Allowed`, 405)
  }

  const { userId } = getAuth(req)
  if (!userId) return apiFail(res, 'Unauthorized', 401)

  try {
    await connectToDatabase()
  } catch {
    if (req.method === 'GET') return apiOk(res, [])
    return apiFail(res, 'Database unavailable. Please try again shortly.', 503)
  }

  try {
    if (req.method === 'GET') {
      const looks = await TryOnLook.find({ userId }).sort({ updatedAt: -1 }).limit(80).lean()
      return apiOk(res, looks)
    }

    if (req.method === 'POST') {
      const action = String(req.body?.action || 'render')
      if (action === 'compare') {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : []
        const looks = await TryOnLook.find({ userId, _id: { $in: ids } }).lean()
        return apiOk(res, compareTryOnLooks(looks as any[]))
      }
      if (action === 'schedule') {
        const look = await TryOnLook.findOne({ _id: String(req.body?.id || ''), userId }).lean()
        if (!look) return apiFail(res, 'Try-on look not found', 404)
        const date = parseDate(req.body?.date)
        if (!date) return apiFail(res, 'A valid schedule date is required', 400)
        const outfit = await createSavedOutfit(userId, look.outfitSnapshot, date)
        const plan = await CalendarOutfit.create({
          userId,
          date,
          outfitId: outfit._id,
          occasion: look.occasion,
          notes: `Scheduled from Virtual Try-On Studio: ${look.title}`,
          status: 'planned'
        })
        return apiOk(res, { outfit, plan }, 201)
      }
      if (action === 'save') {
        const look = await TryOnLook.findOne({ _id: String(req.body?.id || ''), userId })
        if (!look) return apiFail(res, 'Try-on look not found', 404)
        look.favorite = true
        await look.save()
        const outfit = await createSavedOutfit(userId, look.outfitSnapshot)
        return apiOk(res, { look, outfit }, 201)
      }

      const looks = await renderLooks(userId, req.body || {})
      return apiOk(res, looks, 201)
    }

    if (req.method === 'PATCH') {
      const look = await TryOnLook.findOne({ _id: String(req.body?.id || ''), userId })
      if (!look) return apiFail(res, 'Try-on look not found', 404)
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
      return apiOk(res, look)
    }

    const deleted = await TryOnLook.findOneAndDelete({ _id: String(req.query.id || ''), userId })
    if (!deleted) return apiFail(res, 'Try-on look not found', 404)
    return apiOk(res, { ok: true })
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') console.error('[Virtual Try-On]', error)
    const message = error?.message === 'Create or select an avatar before rendering looks.'
      ? error.message
      : error?.message === 'Add enough wardrobe items to generate a try-on look.'
        ? error.message
        : 'Unable to render outfit. Please try again.'
    return apiFail(res, message, 500)
  }
}
