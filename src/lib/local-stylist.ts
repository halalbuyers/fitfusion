import { normalizeCategory, normalizeStyle } from './fashion-analysis'
import { generateOutfits, type GeneratedOutfit, type WardrobeEngineItem } from './outfit-engine'

export type StylistIntent = 'recommendation' | 'weather' | 'college' | 'date' | 'streetwear' | 'formal' | 'wardrobe-analysis' | 'explanation'

export type OutfitCardData = {
  top: string
  bottom: string
  shoes: string
  style: string
  reason: string
}

type StylistContext = {
  message?: string
  outfit?: Partial<GeneratedOutfit> & { items?: any[] }
  wardrobe?: WardrobeEngineItem[]
  occasion?: string
  weather?: string
  temperature?: number
  season?: string
}

type StylistResponse = {
  reply: string
  intent: StylistIntent
  outfitCard?: OutfitCardData
}

const categoryLabels: Record<string, string> = {
  tshirt: 'T-Shirt',
  shirt: 'Shirt',
  hoodie: 'Hoodie',
  jacket: 'Jacket',
  jeans: 'Jeans',
  cargo: 'Cargo Pants',
  shorts: 'Shorts',
  sneakers: 'Sneakers',
  boots: 'Boots',
  accessories: 'Accessory'
}

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function itemName(item: any) {
  const source = item?.clothing || item || {}
  const category = normalizeCategory(source.category)
  const label = categoryLabels[category] || titleCase(String(source.category || 'Item'))
  const colors = [source.primaryColor || source.color, ...(source.secondaryColors || []), ...(source.colors || [])]
    .filter((color) => color && color !== 'unknown')
  const color = colors.length ? titleCase(String(colors[0])) : ''
  const brand = source.brand ? `${titleCase(String(source.brand))} ` : ''
  return `${brand}${color ? `${color} ` : ''}${label}`.trim()
}

function roleFor(item: any) {
  const category = normalizeCategory((item?.clothing || item)?.category)
  if (['tshirt', 'shirt', 'hoodie'].includes(category)) return 'top'
  if (category === 'jacket') return 'layer'
  if (['jeans', 'cargo', 'shorts'].includes(category)) return 'bottom'
  if (['sneakers', 'boots'].includes(category)) return 'shoes'
  return 'accessory'
}

function itemColors(items: any[]) {
  return [...new Set(items.flatMap((entry) => {
    const item = entry?.clothing || entry
    return [item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])]
      .filter((color) => color && color !== 'unknown')
      .map((color) => titleCase(String(color)))
  }))]
}

function styleName(items: any[], fallback?: string) {
  const styles = [...new Set(items.map((item) => normalizeStyle((item?.clothing || item)?.style)).filter(Boolean))]
  return titleCase(fallback || styles.slice(0, 2).join(' ') || 'Modern Casual')
}

function inferIntent(message = ''): StylistIntent {
  const text = message.toLowerCase()
  if (/(missing|gap|need|add|buy|lack|wardrobe analysis|complete my wardrobe)/.test(text)) return 'wardrobe-analysis'
  if (/(why|explain|work|rate|good outfit)/.test(text)) return 'explanation'
  if (/(college|class|campus|lecture)/.test(text)) return 'college'
  if (/(date|dinner|night out)/.test(text)) return 'date'
  if (/(streetwear|street|oversized|cargo)/.test(text)) return 'streetwear'
  if (/(formal|office|interview|wedding|business)/.test(text)) return 'formal'
  if (/(weather|rain|hot|cold|summer|winter|today)/.test(text)) return 'weather'
  return 'recommendation'
}

function occasionForIntent(intent: StylistIntent, fallback = 'casual') {
  if (intent === 'college') return 'college'
  if (intent === 'date') return 'date'
  if (intent === 'streetwear') return 'streetwear'
  if (intent === 'formal') return 'formal'
  return fallback
}

function inferWeather(text = '') {
  const value = text.toLowerCase()
  if (value.includes('rain')) return 'rain'
  if (value.includes('cold') || value.includes('winter')) return 'cold'
  if (value.includes('hot') || value.includes('summer')) return 'hot'
  return 'moderate'
}

function sentenceForPalette(items: any[]) {
  const colors = itemColors(items)
  if (!colors.length) return 'The neutral palette keeps the look clean and easy to repeat.'
  if (colors.length <= 2) return `The ${colors.join(' and ')} palette feels intentional without trying too hard.`
  return `The ${colors.slice(0, 3).join(', ')} palette adds enough contrast while staying coordinated.`
}

function sentenceForWeather(weather: string, season?: string) {
  if (weather === 'hot' || season === 'summer') return 'It stays light enough for warm weather and avoids heavy layers.'
  if (weather === 'cold' || season === 'winter') return 'It has enough visual weight for cooler weather, especially if you add the layer.'
  if (weather === 'rain') return 'For rain, keep the outfit practical with covered footwear and a layer that can handle the weather.'
  return 'It works well for everyday mild weather.'
}

function cardFromItems(items: any[], fallbackStyle?: string, fallbackReason?: string): OutfitCardData {
  const top = items.find((item) => roleFor(item) === 'top')
  const bottom = items.find((item) => roleFor(item) === 'bottom')
  const shoes = items.find((item) => roleFor(item) === 'shoes')
  const layer = items.find((item) => roleFor(item) === 'layer')
  const namedItems = [top, layer, bottom, shoes].filter(Boolean)
  const style = styleName(namedItems.length ? namedItems : items, fallbackStyle)
  const reason = fallbackReason || `${sentenceForPalette(namedItems.length ? namedItems : items)} The proportions are balanced across the top, bottom, and footwear.`

  return {
    top: top ? itemName(top) : layer ? itemName(layer) : 'Add a top from your wardrobe',
    bottom: bottom ? itemName(bottom) : 'Add a bottom from your wardrobe',
    shoes: shoes ? itemName(shoes) : 'Add shoes from your wardrobe',
    style,
    reason
  }
}

function tryParseJson(value: string) {
  const text = value.trim()
  if (!text) return null
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text.match(/({[\s\S]*}|\[[\s\S]*\])/)?.[1]
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch)
  } catch {
    return null
  }
}

export function formatOutfitResponse(input: unknown) {
  const parsed = typeof input === 'string' ? tryParseJson(input) : input
  const outfit = Array.isArray(parsed) ? parsed[0] : parsed

  if (outfit && typeof outfit === 'object') {
    const value = outfit as Record<string, any>
    if (Array.isArray(value.items)) {
      const card = cardFromItems(value.items, value.style, value.reason || value.explanation)
      return `For a clean ${card.style.toLowerCase()} look, wear your ${card.top} with ${card.bottom} and ${card.shoes}. ${card.reason}`
    }

    const top = String(value.top || value.shirt || value.upper || 'top').trim()
    const bottom = String(value.bottom || value.pants || value.jeans || 'bottom').trim()
    const shoes = String(value.shoes || value.footwear || 'shoes').trim()
    const style = titleCase(String(value.style || 'modern casual'))
    const reason = String(value.reason || value.explanation || `The palette creates a balanced outfit that works well for casual everyday wear.`).trim()
    return `For a clean ${style.toLowerCase()} look, wear your ${top} with ${bottom} and ${shoes}. ${reason}`
  }

  return String(input || '').replace(/```[\s\S]*?```/g, '').trim()
}

export function ensureNaturalLanguageResponse(text: string, fallback: string) {
  const formatted = formatOutfitResponse(text)
  if (!formatted) return fallback
  if (tryParseJson(formatted)) return fallback
  if (/^\s*[{[]/.test(formatted)) return fallback
  return formatted
}

function explainOutfit(outfit: Partial<GeneratedOutfit> & { items?: any[] }, context: StylistContext) {
  const items = Array.isArray(outfit.items) ? outfit.items.map((item: any) => item?.clothing || item) : []
  const card = cardFromItems(items, undefined, outfit.explanation)
  const score = Number(outfit.score || 0)
  const strength = score >= 85 ? 'excellent' : score >= 70 ? 'strong' : 'solid'
  const reply = [
    `This outfit works because it has a ${strength} balance of color, silhouette, and context.`,
    `The ${card.top}, ${card.bottom}, and ${card.shoes} sit in a clear ${card.style.toLowerCase()} direction.`,
    sentenceForPalette(items),
    sentenceForWeather(context.weather || inferWeather(context.message), context.season)
  ].join(' ')
  return { reply, intent: 'explanation' as const, outfitCard: card }
}

function analyzeWardrobe(wardrobe: WardrobeEngineItem[]) {
  const counts = wardrobe.reduce<Record<string, number>>((acc, item) => {
    const category = normalizeCategory(item.category)
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})
  const gaps = [
    ['tshirt', 'a clean everyday T-Shirt'],
    ['shirt', 'one sharper Shirt for dates or smart casual plans'],
    ['jeans', 'versatile Jeans'],
    ['sneakers', 'neutral Sneakers'],
    ['jacket', 'a lightweight Jacket for layering']
  ].filter(([category]) => !counts[category]).map(([, label]) => label)

  if (!wardrobe.length) {
    return 'Your wardrobe is empty right now. Start with one neutral top, one pair of jeans or cargos, one pair of clean sneakers, and one light layer. That gives the stylist enough range to build real outfits from your closet.'
  }

  if (!gaps.length) {
    return `Your wardrobe has a healthy base: ${Object.entries(counts).map(([category, count]) => `${count} ${categoryLabels[category] || category}`).join(', ')}. The next upgrade is variety, so add one piece in a color or texture you do not already own.`
  }

  return `Your wardrobe is close, but I would add ${gaps.slice(0, 3).join(', ')}. Those pieces would unlock more balanced outfits because they fill the top, bottom, footwear, and layering roles the generator needs most.`
}

export function generateStylistResponse(context: StylistContext = {}): StylistResponse {
  const message = context.message || ''
  const intent = inferIntent(message)
  const weather = context.weather || inferWeather(message)
  const wardrobe = context.wardrobe || []
  const sourceItems = context.outfit?.items
  const outfitItems = Array.isArray(sourceItems) ? sourceItems.map((item: any) => item?.clothing || item) : []

  if (intent === 'wardrobe-analysis') {
    return { reply: analyzeWardrobe(wardrobe), intent }
  }

  if (outfitItems.length || intent === 'explanation') {
    if (outfitItems.length) return explainOutfit(context.outfit || {}, { ...context, weather })
    return {
      reply: 'Send me the outfit or generate one first, and I will explain the color balance, style direction, weather fit, and what to tweak.',
      intent
    }
  }

  if (!wardrobe.length) {
    return {
      reply: 'I can style you properly once your wardrobe has a top, bottom, and shoes. Add those first, then I can build specific looks instead of giving generic advice.',
      intent
    }
  }

  const occasion = context.occasion || occasionForIntent(intent, 'casual')
  const outfits = generateOutfits(wardrobe, {
    occasion,
    weather,
    season: context.season,
    temperature: context.temperature,
    limit: 3
  })
  const top = outfits[0]

  if (!top) {
    return {
      reply: analyzeWardrobe(wardrobe),
      intent: 'wardrobe-analysis'
    }
  }

  const card = cardFromItems(top.items, undefined, top.explanation)
  const intro = intent === 'weather'
    ? `For today's ${weather} weather, I would keep it practical and polished.`
    : `For a ${occasion.replace('-', ' ')} look, I would build around your ${card.top}.`
  const advice = formatOutfitResponse({
    top: card.top,
    bottom: card.bottom,
    shoes: card.shoes,
    style: card.style,
    reason: `${card.reason} ${sentenceForWeather(weather, context.season)}`
  })
  const reply = `${intro} ${advice}`

  return { reply, intent, outfitCard: card }
}

export function generateStylistAdvice(context: StylistContext = {}) {
  return generateStylistResponse(context).reply
}
