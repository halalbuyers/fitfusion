import type { TravelDayWeather } from './weatherAnalyzer'

export function buildTravelAdvice(input: { weather: TravelDayWeather[]; packingList: Array<{ label: string; owned: boolean; category?: string; quantity?: number; reason?: string }>; travelStyle: string }) {
  const advice: string[] = []
  const rainDay = input.weather.find((day) => day.rain >= 45 || day.condition.includes('rain'))
  const coldEvening = input.weather.find((day) => day.night.temperature <= 16)
  const windyDay = input.weather.find((day) => day.windKph >= 28)
  const highUvDay = input.weather.find((day) => day.uvIndex >= 7)
  const whiteSneakers = input.packingList.find((item) => /white sneakers/i.test(item.label))
  const tops = input.packingList.filter((item) => item.category === 'Tops').length
  const bottoms = input.packingList.filter((item) => item.category === 'Bottoms').length
  const missing = input.packingList.filter((item) => !item.owned && item.category === 'Missing Essentials')
  if (coldEvening) advice.push('Carry one lightweight jacket for cooler evenings.')
  if (whiteSneakers) advice.push('White sneakers can be worn with several outfits, so they earn their luggage space.')
  if (rainDay) advice.push(`Expect rain on ${rainDay.date}. Pack waterproof shoes or a rain jacket.`)
  if (windyDay) advice.push(`Wind peaks around ${windyDay.windKph} kph on ${windyDay.date}. Favor secure layers over loose outerwear.`)
  if (highUvDay) advice.push(`UV reaches ${highUvDay.uvIndex} on ${highUvDay.date}. Sunglasses and breathable daytime outfits matter.`)
  if (tops && bottoms) advice.push(`${tops} tops with ${bottoms} bottoms creates repeatable combinations without overpacking.`)
  if (/business|conference/.test(input.travelStyle)) advice.push('Keep one sharper outfit separate so it stays crisp for meetings.')
  if (/beach/.test(input.travelStyle)) advice.push('Keep swimwear and a dry top accessible so beach days do not disrupt the full suitcase.')
  if (/backpacking|adventure/.test(input.travelStyle)) advice.push('Prioritize one comfortable walking shoe and a small day bag over extra statement pieces.')
  for (const item of missing.slice(0, 4)) {
    advice.push(`${item.label}: ${item.reason || 'Missing from the wardrobe but important for this itinerary.'}`)
  }
  if (!advice.length) advice.push('Your plan is balanced: repeat bottoms, rotate tops, and keep footwear minimal.')
  return [...new Set(advice)].slice(0, 9)
}
