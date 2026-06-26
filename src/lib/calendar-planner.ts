import CalendarOutfit from '../models/CalendarOutfit'
import Clothing from '../models/Clothing'
import Notification from '../models/Notification'
import Outfit from '../models/Outfit'
import Subscription from '../models/Subscription'
import { isPremiumEnabled } from './feature-flags'

const dayMs = 24 * 60 * 60 * 1000

export type PlannerWeather = {
  temperature: number
  condition: string
  suggestion: string
  source: string
}

export function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfDay(value: string | Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function endOfDay(value: string | Date) {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / dayMs))
}

export function weatherSuggestion(temperature: number, condition: string) {
  const text = condition.toLowerCase()
  if (text.includes('rain')) return 'Rain expected: prefer covered shoes and a weather-ready layer.'
  if (temperature >= 32) return 'Hot day: prefer tshirts, linen shirts, shorts, and breathable sneakers; avoid hoodies and jackets.'
  if (temperature <= 12) return 'Cold day: warmer layers, hoodies, jackets, and boots will work better.'
  if (temperature <= 18) return 'Cool day: a light layer or hoodie is useful without going too heavy.'
  return 'Mild weather: balanced tees, shirts, denim, and sneakers should work well.'
}

function codeToCondition(code: number) {
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy'
  if ([71, 73, 75, 85, 86].includes(code)) return 'cold'
  if ([95, 96, 99].includes(code)) return 'storm'
  if ([0, 1].includes(code)) return 'clear'
  if ([2, 3, 45, 48].includes(code)) return 'cloudy'
  return 'moderate'
}

export async function getForecastForDate(date: Date, lat = 28.6139, lon = 77.209): Promise<PlannerWeather> {
  const target = toDateInput(date)
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=16&timezone=auto`)
    if (!response.ok) throw new Error('Forecast unavailable')
    const data = await response.json()
    const index = Array.isArray(data.daily?.time) ? data.daily.time.indexOf(target) : -1
    if (index >= 0) {
      const max = Number(data.daily.temperature_2m_max?.[index] ?? 24)
      const min = Number(data.daily.temperature_2m_min?.[index] ?? max)
      const temperature = Math.round((max + min) / 2)
      const condition = codeToCondition(Number(data.daily.weather_code?.[index] ?? 1))
      return { temperature, condition, suggestion: weatherSuggestion(temperature, condition), source: 'open-meteo-forecast' }
    }
  } catch {
    // Fall through to deterministic seasonal fallback.
  }

  const month = date.getMonth()
  const temperature = month >= 3 && month <= 8 ? 30 : month === 11 || month <= 1 ? 16 : 24
  const condition = temperature >= 28 ? 'hot' : temperature <= 18 ? 'cool' : 'moderate'
  return { temperature, condition, suggestion: weatherSuggestion(temperature, condition), source: 'forecast-fallback' }
}

export async function isPremiumUser(userId: string) {
  if (!isPremiumEnabled()) return true
  const subscription = await Subscription.findOne({ userId }).lean().catch(() => null)
  return Boolean(subscription && ['premium', 'studio'].includes(String(subscription.plan)) && ['active', 'trialing'].includes(String(subscription.status)))
}

export async function assertPlanningAllowed(userId: string, date: Date, feature: 'planning' | 'vacation' | 'event' = 'planning') {
  const premium = await isPremiumUser(userId)
  if (premium) return { premium }
  if (feature !== 'planning') {
    const error = new Error('This planning feature is not enabled for your account yet.')
    ;(error as any).statusCode = 402
    throw error
  }
  const windowDays = daysBetween(new Date(), date)
  if (windowDays > 7) {
    const error = new Error('Future outfit scheduling is not enabled for your account yet.')
    ;(error as any).statusCode = 402
    throw error
  }
  return { premium }
}

function roleFromCategory(category = '') {
  const value = category.toLowerCase()
  if (/(shirt|tshirt|tee|hoodie|polo|blouse|kurti|dress)/.test(value)) return 'top'
  if (/(jeans|cargo|shorts|pants|trouser|skirt|chinos)/.test(value)) return 'bottom'
  if (/(sneaker|shoe|boot|loafer|oxford|heel|sandal|slide)/.test(value)) return 'shoes'
  if (/(jacket|blazer|coat|layer)/.test(value)) return 'layer'
  return 'accessory'
}

function entryId(entry: any) {
  const clothing = entry?.clothing || entry
  return String(clothing?._id || clothing?.id || entry?.id || '')
}

export async function getRotationMemory(userId: string, date: Date, days = 6) {
  const from = addDays(startOfDay(date), -days)
  const to = addDays(endOfDay(date), days)
  const rows = await CalendarOutfit.find({ userId, date: { $gte: from, $lte: to }, status: { $ne: 'skipped' } })
    .populate({ path: 'outfitId', populate: { path: 'items.clothing', model: Clothing } })
    .lean()
    .catch(() => [])

  const outfitKeys = new Set<string>()
  const roleItems: Record<string, Set<string>> = { top: new Set(), shoes: new Set(), bottom: new Set(), layer: new Set() }
  for (const row of rows as any[]) {
    const outfit = row.outfitId
    if (outfit?.outfitKey) outfitKeys.add(String(outfit.outfitKey))
    for (const entry of outfit?.items || []) {
      const clothing = entry?.clothing || {}
      const role = String(entry?.role || roleFromCategory(clothing.category))
      if (roleItems[role]) roleItems[role].add(entryId(entry))
    }
  }
  return {
    outfitKeys,
    topIds: roleItems.top,
    shoeIds: roleItems.shoes,
    bottomIds: roleItems.bottom,
    layerIds: roleItems.layer
  }
}

export function chooseRotatedOutfit<T extends { outfitKey?: string; items?: Array<{ id?: string; role?: string }> }>(outfits: T[], memory: Awaited<ReturnType<typeof getRotationMemory>>) {
  const scored = outfits.map((outfit) => {
    let penalty = memory.outfitKeys.has(String(outfit.outfitKey || '')) ? 100 : 0
    for (const item of outfit.items || []) {
      const id = String(item.id || '')
      const role = String(item.role || '')
      if (role.includes('top') && memory.topIds.has(id)) penalty += 26
      if (role.includes('shoe') && memory.shoeIds.has(id)) penalty += 26
      if (role.includes('bottom') && memory.bottomIds.has(id)) penalty += 12
      if (role.includes('layer') && memory.layerIds.has(id)) penalty += 10
    }
    return { outfit, penalty }
  })
  scored.sort((a, b) => a.penalty - b.penalty)
  return scored[0]?.outfit || outfits[0]
}

export async function createCalendarNotification(userId: string, plan: any) {
  const weather = plan.weather?.temperature ? `${plan.weather.temperature}C ${plan.weather.condition || ''}`.trim() : 'weather checked'
  await Notification.create({
    userId,
    type: 'calendar',
    title: "Today's Outfit Ready",
    body: `${weather} / ${plan.occasion || 'casual'} outfit planned.`
  }).catch(() => null)
}

export function packingListFor(days: number, destination: string, occasions: string[], weather: PlannerWeather) {
  const hot = weather.temperature >= 28 || weather.condition.includes('hot')
  const cold = weather.temperature <= 18 || weather.condition.includes('cold')
  const formal = occasions.some((item) => ['wedding', 'office', 'formal', 'party'].includes(item.toLowerCase()))
  return [
    { item: 'tshirts', quantity: Math.max(3, Math.ceil(days * 0.75)), reason: hot ? `Breathable tops for ${destination}.` : 'Daily base layers.' },
    { item: hot ? 'shorts' : 'jeans', quantity: hot ? Math.max(2, Math.ceil(days / 3)) : Math.max(1, Math.ceil(days / 4)), reason: hot ? 'Better for heat and humidity.' : 'Reliable rotation bottoms.' },
    { item: 'sneakers', quantity: 1, reason: 'Comfortable default footwear for travel days.' },
    { item: 'formal shirt', quantity: formal ? 1 : 0, reason: formal ? 'Covers office, dinner, party, or wedding plans.' : 'Optional unless your trip has formal events.' },
    { item: cold ? 'jacket' : 'light overshirt', quantity: cold ? 1 : 0, reason: cold ? 'Needed for cooler days.' : 'Skip if the forecast stays hot.' },
    { item: 'accessories', quantity: Math.max(1, Math.ceil(days / 5)), reason: 'Small pieces add variety without taking luggage space.' }
  ].filter((entry) => entry.quantity > 0)
}
