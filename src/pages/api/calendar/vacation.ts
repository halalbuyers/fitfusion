import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { assertPlanningAllowed, daysBetween, getForecastForDate, packingListFor, startOfDay } from '../../../lib/calendar-planner'
import { connectToDatabase } from '../../../lib/mongodb'

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  res.setHeader('Vary', 'Cookie')
}

function parseDate(value: unknown) {
  const date = value ? new Date(String(value)) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function parseOccasions(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res)

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  try {
    const startDate = parseDate(req.body?.startDate)
    const endDate = parseDate(req.body?.endDate)
    if (!startDate || !endDate) return res.status(400).json({ error: 'Travel dates are required' })

    const start = startOfDay(startDate)
    const end = startOfDay(endDate)
    if (end.getTime() < start.getTime()) return res.status(400).json({ error: 'End date must be after start date' })

    await assertPlanningAllowed(userId, start, 'vacation')

    const destination = String(req.body?.destination || 'your trip').trim() || 'your trip'
    const occasions = parseOccasions(req.body?.occasions)
    const lat = req.body?.lat === undefined ? undefined : Number(req.body.lat)
    const lon = req.body?.lon === undefined ? undefined : Number(req.body.lon)
    const weather = await getForecastForDate(start, Number.isFinite(lat) ? lat : undefined, Number.isFinite(lon) ? lon : undefined)
    const days = daysBetween(start, end) + 1
    const packingList = packingListFor(days, destination, occasions.length ? occasions : ['casual', 'travel'], weather)

    return res.status(200).json({ destination, startDate: start, endDate: end, days, weather, occasions, packingList })
  } catch (error: any) {
    const status = Number(error?.statusCode || 500)
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: error?.message || 'Could not create vacation packing list'
    })
  }
}
