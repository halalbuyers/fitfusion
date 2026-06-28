import { analyzeWeather } from '../weather-engine'

export type TravelDayWeather = {
  date: string
  temperature: number
  condition: string
  rain: number
  windKph: number
  uvIndex: number
  morning: { temperature: number; condition: string }
  afternoon: { temperature: number; condition: string }
  night: { temperature: number; condition: string }
  advice: string
  source?: string
}

const weatherCache = new Map<string, { expires: number; value: TravelDayWeather[] }>()
const geocodeCache = new Map<string, { expires: number; value: { lat: number; lon: number; label: string } | null }>()

const forecastTimeoutMs = 900
const cacheMs = 1000 * 60 * 60

function codeToCondition(code: number) {
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain'
  if ([71, 73, 75, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'storm'
  if ([0, 1].includes(code)) return 'clear'
  if ([2, 3, 45, 48].includes(code)) return 'cloudy'
  return 'moderate'
}

function monthForDate(value: string) {
  const month = Number(value.slice(5, 7))
  return Number.isFinite(month) ? month : new Date(value).getMonth() + 1
}

function seasonalTemperature(date: string, lat?: number) {
  const month = monthForDate(date)
  const northern = typeof lat !== 'number' || lat >= 0
  const summerMonths = northern ? [6, 7, 8] : [12, 1, 2]
  const winterMonths = northern ? [12, 1, 2] : [6, 7, 8]
  if (summerMonths.includes(month)) return 28
  if (winterMonths.includes(month)) return Math.abs(lat || 0) > 35 ? 12 : 20
  return 23
}

function fallbackWeather(dates: string[], lat?: number): TravelDayWeather[] {
  return dates.map((date, index) => {
    const temperature = seasonalTemperature(date, lat) + (index % 3) - 1
    const condition = temperature >= 28 ? 'warm' : temperature <= 14 ? 'cool' : 'moderate'
    return {
      date,
      temperature,
      condition,
      rain: 0,
      windKph: 10,
      uvIndex: 5,
      morning: { temperature: temperature - 2, condition },
      afternoon: { temperature: temperature + 2, condition },
      night: { temperature: temperature - 3, condition },
      advice: analyzeWeather({ temperature, condition }).tip,
      source: 'seasonal-fallback'
    }
  })
}

async function fetchJsonWithTimeout(url: string, timeoutMs = forecastTimeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('request unavailable')
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

async function geocodeDestination(destination: string) {
  const key = destination.trim().toLowerCase()
  if (!key) return null
  const cached = geocodeCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.value

  try {
    const data = await fetchJsonWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`, 650)
    const result = Array.isArray(data?.results) ? data.results[0] : null
    const lat = Number(result?.latitude)
    const lon = Number(result?.longitude)
    const value = Number.isFinite(lat) && Number.isFinite(lon)
      ? { lat, lon, label: [result?.name, result?.country].filter(Boolean).join(', ') || destination }
      : null
    geocodeCache.set(key, { expires: Date.now() + cacheMs, value })
    return value
  } catch {
    geocodeCache.set(key, { expires: Date.now() + 1000 * 60 * 10, value: null })
    return null
  }
}

function weatherFromDaily(date: string, daily: any, index: number): TravelDayWeather {
  const max = Math.round(Number(daily?.temperature_2m_max?.[index] ?? 26))
  const min = Math.round(Number(daily?.temperature_2m_min?.[index] ?? 20))
  const temperature = Math.round((max + min) / 2)
  const baseCondition = codeToCondition(Number(daily?.weather_code?.[index] ?? 1))
  const rain = Number(daily?.precipitation_probability_max?.[index] ?? 0)
  const condition = rain >= 45 ? 'rain' : baseCondition
  const windKph = Math.round(Number(daily?.wind_speed_10m_max?.[index] ?? 10))
  const uvIndex = Math.round(Number(daily?.uv_index_max?.[index] ?? 5))
  return {
    date,
    temperature,
    condition,
    rain,
    windKph,
    uvIndex,
    morning: { temperature: min, condition },
    afternoon: { temperature: max, condition },
    night: { temperature: min - 1, condition },
    advice: analyzeWeather({ temperature, condition }).tip,
    source: 'open-meteo'
  }
}

export async function getTravelWeather(input: { destination: string; dates: string[]; lat?: number; lon?: number }) {
  const key = `${input.destination}:${input.dates.join(',')}:${input.lat || ''}:${input.lon || ''}`
  const cached = weatherCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.value
  if (!input.dates.length) return []

  let value = fallbackWeather(input.dates, input.lat)
  try {
    const geocoded = Number.isFinite(input.lat) && Number.isFinite(input.lon)
      ? { lat: Number(input.lat), lon: Number(input.lon), label: input.destination }
      : await geocodeDestination(input.destination)
    const lat = geocoded?.lat
    const lon = geocoded?.lon
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('destination coordinates unavailable')

    const data = await fetchJsonWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&forecast_days=16&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto`)
    const time: string[] = Array.isArray(data.daily?.time) ? data.daily.time : []
    const forecastByDate = new Map(time.map((date, index) => [date, weatherFromDaily(date, data.daily, index)]))
    const seasonal = fallbackWeather(input.dates, lat)
    value = input.dates.map((date, index) => forecastByDate.get(date) || seasonal[index])
  } catch {
    value = fallbackWeather(input.dates, input.lat)
  }

  weatherCache.set(key, { expires: Date.now() + cacheMs, value })
  return value
}
