import { generateOutfits, outfitColorSignature, outfitKey, outfitStructureKey, type GeneratedOutfit } from '../outfit-engine'
import { normalizeCategory } from '../fashion-analysis'
import type { TravelDayWeather } from './weatherAnalyzer'

export type ScheduledTravelOutfit = {
  date: string
  slot: 'morning' | 'evening' | 'night'
  outfit: GeneratedOutfit
  weather: TravelDayWeather
}

function categoryRole(category?: string) {
  const normalized = normalizeCategory(category)
  if (['tshirt', 'shirt', 'hoodie', 'blouse', 'dress', 'kurti', 'saree'].includes(normalized)) return 'top'
  if (['jeans', 'cargo', 'shorts', 'skirt'].includes(normalized)) return 'bottom'
  if (['sneakers', 'boots', 'heels'].includes(normalized)) return 'shoes'
  if (normalized === 'jacket') return 'layer'
  return 'accessory'
}

function itemId(item: any) {
  return String(item?._id || item?.id || item?.image || `${item?.category || 'item'}-${item?.primaryColor || item?.color || ''}`)
}

function occasionForSlot(slot: ScheduledTravelOutfit['slot'], travelStyle: string, activities: string[]) {
  const activityText = activities.join(' ').toLowerCase()
  if (slot === 'night') {
    if (/business|conference|wedding|luxury/.test(travelStyle) || /dinner|wedding|gala|reception/.test(activityText)) return 'formal'
    return 'party'
  }
  if (/business|conference/.test(travelStyle) || /meeting|conference|office/.test(activityText)) return 'office'
  if (/adventure|backpacking|road trip/.test(travelStyle) || /hike|trek|walk|travel/.test(activityText)) return 'travel'
  if (/wedding|luxury/.test(travelStyle)) return 'formal'
  return 'casual'
}

function adjustedOutfitScore(outfit: GeneratedOutfit, usage: Record<string, number>, recentTops: Set<string>) {
  const repeatPenalty = (outfit.items || []).reduce((sum, item) => {
    const role = categoryRole(item.category)
    const id = itemId(item)
    const count = Number(usage[id] || 0)
    const weight = role === 'top' ? 11 : role === 'bottom' ? 4 : role === 'shoes' ? 2 : role === 'layer' ? 3 : 1
    return sum + count * weight + (role === 'top' && recentTops.has(id) ? 18 : 0)
  }, 0)
  return Number(outfit.score || 0) - repeatPenalty
}

export function scheduleTripOutfits(input: { wardrobe: any[]; dates: string[]; weather: TravelDayWeather[]; travelStyle: string; activities: string[] }) {
  const slots: Array<ScheduledTravelOutfit['slot']> = ['morning', 'evening', 'night']
  const previousOutfitKeys: string[] = []
  const recentStructures: string[] = []
  const recentColorSignatures: string[] = []
  const itemUsageCount: Record<string, number> = {}
  const recentTops = new Set<string>()
  const scheduled: ScheduledTravelOutfit[] = []
  const generatedByContext = new Map<string, GeneratedOutfit[]>()

  for (const [dayIndex, date] of input.dates.entries()) {
    const dayWeather = input.weather.find((item) => item.date === date) || input.weather[0]
    if (!dayWeather) continue

    for (const slot of slots) {
      const occasion = occasionForSlot(slot, input.travelStyle, input.activities)
      const temperature = slot === 'morning'
        ? dayWeather.morning.temperature
        : slot === 'night'
          ? dayWeather.night.temperature
          : dayWeather.afternoon.temperature
      const weatherBand = temperature >= 28 ? 'hot' : temperature <= 14 ? 'cold' : temperature <= 20 ? 'cool' : 'mild'
      const contextKey = `${occasion}:${dayWeather.condition}:${weatherBand}:${slot}`
      let outfits = generatedByContext.get(contextKey)
      if (!outfits) {
        outfits = generateOutfits(input.wardrobe, {
          occasion,
          weather: dayWeather?.condition,
          temperature,
          previousOutfitKeys,
          itemUsageCount,
          recentStructures,
          recentColorSignatures,
          rain: dayWeather.rain,
          windKph: dayWeather.windKph,
          uvIndex: dayWeather.uvIndex,
          timeOfDay: slot,
          limit: 12
        })
        generatedByContext.set(contextKey, outfits)
      }
      const outfit = outfits
        .slice()
        .sort((a, b) => adjustedOutfitScore(b, itemUsageCount, recentTops) - adjustedOutfitScore(a, itemUsageCount, recentTops))[0]
      if (!outfit) continue

      const key = outfit.outfitKey || outfitKey(outfit.items)
      previousOutfitKeys.push(key)
      recentStructures.push(outfitStructureKey(outfit.items))
      recentColorSignatures.push(outfitColorSignature(outfit.items))
      for (const item of outfit.items || []) {
        const id = itemId(item)
        const role = categoryRole(item.category)
        itemUsageCount[id] = Number(itemUsageCount[id] || 0) + 1
        if (role === 'top') recentTops.add(id)
      }
      if (dayIndex > 1) {
        for (const entry of scheduled.filter((value) => value.date === input.dates[dayIndex - 2])) {
          for (const item of entry.outfit.items || []) {
            if (categoryRole(item.category) === 'top') recentTops.delete(itemId(item))
          }
        }
      }

      scheduled.push({ date, slot, outfit, weather: dayWeather })
    }
  }

  return scheduled
}
