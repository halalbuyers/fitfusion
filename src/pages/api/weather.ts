import type { NextApiRequest, NextApiResponse } from 'next'

function suggestionFor(temp: number, condition: string) {
  const text = condition.toLowerCase()
  if (text.includes('rain')) return 'Add a jacket layer and choose darker weather-ready shoes.'
  if (temp <= 12) return 'Cold day: hoodie plus jacket combinations will score higher.'
  if (temp >= 28) return 'Hot day: light tees, shirts, shorts, and breathable sneakers are best.'
  if (temp <= 18) return 'Mild chill: use a hoodie or overshirt for an easy layered fit.'
  return 'Balanced weather: clean tee, denim, and sneaker palettes should work well.'
}

function codeToCondition(code: number) {
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain'
  if ([71, 73, 75, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'storm'
  if ([0, 1].includes(code)) return 'clear'
  if ([2, 3, 45, 48].includes(code)) return 'cloudy'
  return 'moderate'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const lat = Number(req.query.lat || 28.6139)
  const lon = Number(req.query.lon || 77.209)

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
    if (!response.ok) throw new Error('Weather unavailable')
    const data = await response.json()
    const temperature = Math.round(Number(data.current?.temperature_2m ?? 24))
    const condition = codeToCondition(Number(data.current?.weather_code ?? 1))
    return res.status(200).json({
      temperature,
      condition,
      suggestion: suggestionFor(temperature, condition),
      source: 'open-meteo'
    })
  } catch {
    return res.status(200).json({
      temperature: 24,
      condition: 'moderate',
      suggestion: suggestionFor(24, 'moderate'),
      source: 'fallback'
    })
  }
}
