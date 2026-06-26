import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { generateOutfitsForUser } from '../../../ai/outfit'
import { connectToDatabase } from '../../../lib/mongodb'
import {
  addDays,
  assertPlanningAllowed,
  chooseRotatedOutfit,
  createCalendarNotification,
  daysBetween,
  endOfDay,
  getForecastForDate,
  getRotationMemory,
  startOfDay,
  toDateInput
} from '../../../lib/calendar-planner'
import { recordOutfitInteraction } from '../../../lib/learning-engine'
import CalendarOutfit, { type CalendarOutfitStatus } from '../../../models/CalendarOutfit'
import Clothing from '../../../models/Clothing'
import Outfit from '../../../models/Outfit'

const statuses: CalendarOutfitStatus[] = ['planned', 'worn', 'skipped']
const eventOccasions = ['wedding', 'party', 'festival', 'date']

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  res.setHeader('Vary', 'Cookie')
}

function seasonForDate(date: Date) {
  const month = date.getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

function parseDate(value: unknown) {
  const date = value ? new Date(String(value)) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function isTodayOrTomorrow(date: Date) {
  const days = daysBetween(new Date(), date)
  return days >= 0 && days <= 1
}

async function populatePlan(plan: any) {
  await plan.populate({
    path: 'outfitId',
    populate: { path: 'items.clothing', model: Clothing }
  })
  return serializePlan(plan)
}

function serializePlan(plan: any) {
  const value = typeof plan.toObject === 'function' ? plan.toObject() : plan
  return {
    ...value,
    dateKey: value?.date ? toDateInput(new Date(value.date)) : undefined
  }
}

function outfitTitle(occasion: string, date: Date) {
  const day = date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
  return `${occasion || 'casual'} outfit for ${day}`
}

async function createOutfitFromGenerated(userId: string, generated: any, occasion: string, date: Date) {
  return Outfit.create({
    userId,
    title: generated.title || outfitTitle(occasion, date),
    occasion,
    items: (generated.items || []).map((item: any) => ({ clothing: item.id || item.clothing?._id || item.clothing, role: item.role })),
    score: generated.score || 0,
    explanation: generated.explanation,
    colorAnalysis: generated.colorAnalysis,
    breakdown: generated.breakdown || {},
    tags: generated.tags || [],
    outfitKey: generated.outfitKey,
    confidence: generated.confidence,
    method: generated.method || 'local',
    isFavorite: false,
    plannedFor: date
  })
}

async function updateCalendarPlan(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { id, status, notes, occasion, date } = req.body || {}
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Calendar outfit id is required' })
  if (status && !statuses.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  const plan = await CalendarOutfit.findOne({ _id: id, userId })
  if (!plan) return res.status(404).json({ error: 'Calendar outfit not found' })

  const previousStatus = plan.status
  if (typeof notes === 'string') plan.notes = notes
  if (typeof occasion === 'string' && occasion.trim()) {
    plan.occasion = occasion.trim().toLowerCase()
  }
  if (date) {
    const nextDate = parseDate(date)
    if (!nextDate) return res.status(400).json({ error: 'Invalid date' })
    await assertPlanningAllowed(userId, nextDate, 'planning')
    plan.date = startOfDay(nextDate)
    await Outfit.updateOne({ _id: plan.outfitId, userId }, { $set: { plannedFor: plan.date } }).catch(() => null)
  }
  if (status) plan.status = status

  await plan.save()

  if (status === 'worn' && previousStatus !== 'worn') {
    await recordOutfitInteraction({ userId, outfitId: String(plan.outfitId), action: 'worn' }).catch(() => null)
  }

  return res.status(200).json(await populatePlan(plan))
}

async function deleteCalendarPlan(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const id = typeof req.query.id === 'string' ? req.query.id : req.body?.id
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Calendar outfit id is required' })

  const plan = await CalendarOutfit.findOneAndDelete({ _id: id, userId }) as any
  if (!plan) return res.status(404).json({ error: 'Calendar outfit not found' })
  await Outfit.updateOne({ _id: plan.outfitId, userId }, { $unset: { plannedFor: '' } }).catch(() => null)
  return res.status(200).json({ ok: true })
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
      const from = parseDate(req.query.from) || startOfDay(new Date())
      const to = parseDate(req.query.to) || endOfDay(addDays(from, 30))
      const plans = await CalendarOutfit.find({
        userId,
        date: { $gte: startOfDay(from), $lte: endOfDay(to) }
      })
        .populate({ path: 'outfitId', populate: { path: 'items.clothing', model: Clothing } })
        .sort({ date: 1, createdAt: -1 })
        .lean()
      return res.status(200).json(plans.map(serializePlan))
    }

    if (req.method === 'PATCH') return updateCalendarPlan(req, res, userId)
    if (req.method === 'DELETE') return deleteCalendarPlan(req, res, userId)

    const requestedDate = parseDate(req.body?.date)
    if (!requestedDate) return res.status(400).json({ error: 'A valid planning date is required' })
    const date = startOfDay(requestedDate)
    const occasion = String(req.body?.occasion || 'casual').trim().toLowerCase()
    const notes = String(req.body?.notes || '').trim()
    const mode = req.body?.mode === 'hybrid' ? 'hybrid' : 'basic'
    const replaceId = typeof req.body?.replaceId === 'string' ? req.body.replaceId : ''
    const lat = req.body?.lat === undefined ? undefined : Number(req.body.lat)
    const lon = req.body?.lon === undefined ? undefined : Number(req.body.lon)

    const feature = eventOccasions.includes(occasion) && daysBetween(new Date(), date) > 7 ? 'event' : 'planning'
    await assertPlanningAllowed(userId, date, feature)

    const forecast = await getForecastForDate(date, Number.isFinite(lat) ? lat : undefined, Number.isFinite(lon) ? lon : undefined)
    const generatedOutfits = await generateOutfitsForUser(userId, {
      occasion,
      weather: forecast.condition,
      temperature: forecast.temperature,
      season: seasonForDate(date),
      mode,
      limit: 10
    })
    if (!generatedOutfits.length) return res.status(400).json({ error: 'Add enough wardrobe items before planning an outfit.' })

    const memory = await getRotationMemory(userId, date, 6)
    const selected = chooseRotatedOutfit(generatedOutfits, memory)
    const outfit = await createOutfitFromGenerated(userId, selected, occasion, date)

    let plan
    if (replaceId) {
      plan = await CalendarOutfit.findOne({ _id: replaceId, userId })
      if (!plan) return res.status(404).json({ error: 'Calendar outfit not found' })
      await Outfit.updateOne({ _id: plan.outfitId, userId }, { $unset: { plannedFor: '' } }).catch(() => null)
      plan.set({ date, outfitId: outfit._id, occasion, weather: forecast, notes, status: 'planned' })
      await plan.save()
    } else {
      plan = await CalendarOutfit.create({
        userId,
        date,
        outfitId: outfit._id,
        occasion,
        weather: forecast,
        notes,
        status: 'planned'
      })
    }

    if (isTodayOrTomorrow(date)) await createCalendarNotification(userId, plan).catch(() => null)
    return res.status(201).json(await populatePlan(plan))
  } catch (error: any) {
    const status = Number(error?.statusCode || 500)
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: error?.message || 'Could not process calendar outfit request'
    })
  }
}
