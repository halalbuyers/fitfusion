import { normalizeCategory, normalizeStyle } from './fashion-analysis'
import { generateOutfits, type GeneratedOutfit, type WardrobeEngineItem } from './outfit-engine'

type StylistContext = {
  message?: string
  outfit?: Partial<GeneratedOutfit> & { items?: any[] }
  wardrobe?: WardrobeEngineItem[]
  occasion?: string
  weather?: string
  temperature?: number
  season?: string
}

function inferOccasion(text = '') {
  const value = text.toLowerCase()
  if (value.includes('date')) return 'date'
  return ['college', 'formal', 'party', 'travel', 'gym', 'summer', 'winter', 'streetwear', 'casual'].find((item) => value.includes(item)) || 'casual'
}

function inferWeather(text = '') {
  const value = text.toLowerCase()
  if (value.includes('rain')) return 'rain'
  if (value.includes('cold') || value.includes('winter')) return 'cold'
  if (value.includes('hot') || value.includes('summer')) return 'hot'
  return 'moderate'
}

function itemColors(item: any) {
  const colors = [item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])]
    .filter((color) => color && color !== 'unknown')
  return colors.length ? [...new Set(colors)].slice(0, 3).join('/') : 'neutral'
}

function formatItem(item: any) {
  const source = item?.clothing || item
  const category = normalizeCategory(source?.category)
  const style = normalizeStyle(source?.style)
  return `${itemColors(source)} ${category}${style ? ` (${style})` : ''}`
}

function paletteSentence(items: any[]) {
  const colors = [...new Set(items.flatMap((entry) => {
    const item = entry?.clothing || entry
    return [item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])]
      .filter((color) => color && color !== 'unknown')
      .map(String)
  }))]
  if (!colors.length) return 'The neutral palette keeps the outfit clean and easy to wear.'
  if (colors.length <= 2) return `The ${colors.join(' and ')} palette creates a clean, intentional look.`
  return `The ${colors.slice(0, 3).join(', ')} palette adds interest while staying coordinated.`
}

function weatherSentence(weather: string, season?: string) {
  if (weather === 'hot' || season === 'summer') return 'The lighter categories make it practical for warm weather.'
  if (weather === 'cold' || season === 'winter') return 'The warmth and layering choices make it better suited to cooler conditions.'
  if (weather === 'rain') return 'The weather-aware ranking favors coverage and avoids fragile styling choices.'
  return 'The pieces are balanced for mild weather without overbuilding the outfit.'
}

export function generateStylistAdvice(context: StylistContext = {}) {
  const message = context.message || ''
  const occasion = context.occasion || inferOccasion(message)
  const weather = context.weather || inferWeather(message)
  const season = context.season
  const sourceItems = context.outfit?.items
  const outfitItems = Array.isArray(sourceItems) ? sourceItems.map((item: any) => item?.clothing || item) : []

  if (outfitItems.length) {
    const score = Number(context.outfit?.score || 0)
    const styles = [...new Set(outfitItems.map((item) => normalizeStyle(item.style)))]
    const scorePhrase = score >= 85 ? 'a strong' : score >= 70 ? 'a reliable' : 'a workable'
    return [
      `This is ${scorePhrase} ${occasion} outfit at ${score || 'solid'}% because the ${styles.join(' and ')} styling stays consistent.`,
      paletteSentence(outfitItems),
      weatherSentence(weather, season),
      `Use simple accessories so the ${outfitItems.map((item) => normalizeCategory(item.category)).join(', ')} combination remains the focus.`
    ].join(' ')
  }

  const wardrobe = context.wardrobe || []
  if (!wardrobe.length) {
    return [
      'I can still help offline, but your wardrobe is empty right now.',
      'Add at least one top, one bottom, and one pair of shoes so FitFusion can score complete outfits from your actual closet.'
    ].join('\n\n')
  }

  const outfits = generateOutfits(wardrobe, { occasion, weather, season, temperature: context.temperature, limit: 3 })
  const top = outfits[0]
  if (!top) {
    const categories = [...new Set(wardrobe.map((item) => normalizeCategory(item.category)))].join(', ')
    return `You have ${wardrobe.length} saved pieces across ${categories || 'several categories'}, but I need a complete top, bottom, and shoes combination to style this request.`
  }

  const alternatives = outfits.slice(1).map((outfit, index) => {
    return `Option ${index + 2}: ${outfit.items.map(formatItem).join(' + ')} (${outfit.score}/100)`
  }).join('\n')

  return [
    `For ${occasion} in ${weather} weather, wear: ${top.items.map(formatItem).join(' + ')}.`,
    `Score: ${top.score}/100. ${top.explanation}`,
    paletteSentence(top.items),
    weatherSentence(weather, season),
    alternatives ? `Backup fits:\n${alternatives}` : ''
  ].filter(Boolean).join('\n\n')
}
