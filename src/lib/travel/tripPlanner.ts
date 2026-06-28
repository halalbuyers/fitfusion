export type TripInput = {
  destination: string
  startDate: string
  endDate: string
  purpose?: string
  activities?: string[] | string
  transportation?: string
  travelStyle?: string
  lat?: number
  lon?: number
}

const maxTripDays = 60
const supportedTravelStyles = ['business', 'vacation', 'adventure', 'luxury', 'backpacking', 'beach', 'winter', 'road trip', 'wedding', 'conference']

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseTripDate(value: string) {
  const text = String(value || '').trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
    : new Date(text)
  if (!Number.isNaN(date.getTime())) date.setHours(12, 0, 0, 0)
  return date
}

export function parseActivities(value?: string[] | string) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',')
  return [...new Set(raw.map(String).map((item) => item.trim()).filter(Boolean))].slice(0, 18)
}

export function tripDates(startValue: string, endValue: string) {
  const start = parseTripDate(startValue)
  const end = parseTripDate(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Valid trip dates are required')
  if (end.getTime() < start.getTime()) throw new Error('End date must be on or after start date')
  const dates: string[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    if (dates.length >= maxTripDays) throw new Error(`Trips can be planned for up to ${maxTripDays} days`)
    dates.push(dateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function normalizeTravelStyle(value?: string) {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return 'vacation'
  return supportedTravelStyles.find((style) => text.includes(style)) || text
}

export function normalizeTripInput(input: TripInput) {
  const dates = tripDates(input.startDate, input.endDate)
  const destination = String(input.destination || '').trim()
  if (!destination) throw new Error('Destination is required')
  const travelStyle = normalizeTravelStyle(input.travelStyle || input.purpose)
  return {
    destination,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    days: dates.length,
    dates,
    purpose: String(input.purpose || travelStyle || 'Vacation').trim(),
    activities: parseActivities(input.activities),
    transportation: String(input.transportation || '').trim(),
    travelStyle,
    lat: typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat : undefined,
    lon: typeof input.lon === 'number' && Number.isFinite(input.lon) ? input.lon : undefined
  }
}
