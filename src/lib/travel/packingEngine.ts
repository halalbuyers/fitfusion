import { normalizeCategory } from '../fashion-analysis'
import type { TravelDayWeather } from './weatherAnalyzer'

type WardrobeItem = {
  _id?: string
  id?: string
  image?: string
  category?: string
  primaryColor?: string
  color?: string
  style?: string
  season?: string
  wearCount?: number
  usageCount?: number
}

export type PackingListItem = {
  id: string
  label: string
  category: string
  quantity: number
  reason: string
  wardrobeItemId?: string
  image?: string
  owned: boolean
}

const topCategories = ['tshirt', 'shirt', 'hoodie', 'blouse', 'dress', 'kurti', 'saree']
const bottomCategories = ['jeans', 'cargo', 'shorts', 'skirt']
const shoeCategories = ['sneakers', 'boots', 'heels']
const jacketCategories = ['jacket', 'hoodie']
const accessoryCategories = ['accessories', 'handbag']

function itemLabel(item: WardrobeItem) {
  return `${item.primaryColor || item.color || ''} ${item.category || 'item'}`.trim().replace(/\s+/g, ' ')
}

function itemId(item: WardrobeItem) {
  return String(item._id || item.id || item.image || itemLabel(item))
}

function itemText(item: WardrobeItem) {
  return [
    item.category,
    item.primaryColor,
    item.color,
    item.style,
    item.season
  ].filter(Boolean).join(' ').toLowerCase()
}

function categoryOf(item: WardrobeItem) {
  const text = itemText(item)
  if (/chino|trouser|pant|slack/.test(text)) return 'jeans'
  if (/loafer|oxford|formal shoe|dress shoe/.test(text)) return 'boots'
  if (/belt|watch|sunglass|tie|scarf|cap|hat|jewelry|jewellery/.test(text)) return 'accessories'
  return normalizeCategory(item.category)
}

function matchesAny(item: WardrobeItem, categories: string[]) {
  return categories.includes(categoryOf(item))
}

function itemScore(item: WardrobeItem, travelStyle: string, activities: string[], weather: TravelDayWeather[]) {
  const text = `${itemText(item)} ${activities.join(' ')} ${travelStyle}`.toLowerCase()
  let score = Number(item.usageCount || item.wearCount || 0)
  if (text.includes('favorite') || (item as any).favorite || (item as any).isFavorite) score += 8
  if (/business|conference|wedding|formal/.test(travelStyle) && /formal|blazer|shirt|heel|boot|dress|saree|kurti/.test(text)) score += 8
  if (/adventure|backpacking|road trip/.test(travelStyle) && /cargo|sneaker|boot|hoodie|jacket|sport/.test(text)) score += 7
  if (/beach/.test(travelStyle) && /short|tee|tshirt|shirt|sandal|light|linen/.test(text)) score += 7
  if (weather.some((day) => day.rain >= 45 || day.condition.includes('rain')) && /jacket|boot|nylon|water/.test(text)) score += 6
  if (weather.some((day) => day.temperature <= 14) && /jacket|hoodie|coat|boot|winter|wool/.test(text)) score += 6
  if (weather.some((day) => day.temperature >= 28) && /hoodie|coat|wool|fleece/.test(text)) score -= 10
  return score
}

function pick(items: WardrobeItem[], categories: string[], limit: number, usedIds: Set<string>, context: { travelStyle: string; activities: string[]; weather: TravelDayWeather[] }) {
  return items
    .filter((item) => matchesAny(item, categories))
    .filter((item) => !usedIds.has(itemId(item)))
    .sort((a, b) => itemScore(b, context.travelStyle, context.activities, context.weather) - itemScore(a, context.travelStyle, context.activities, context.weather))
    .slice(0, limit)
}

function ownedEntry(item: WardrobeItem, category: string, reason: string): PackingListItem {
  const id = itemId(item)
  return {
    id,
    label: itemLabel(item),
    category,
    quantity: 1,
    reason,
    wardrobeItemId: String(item._id || item.id || ''),
    image: item.image,
    owned: true
  }
}

function essential(label: string, category: string, quantity: number, reason: string): PackingListItem {
  return { id: `${category}-${label}`.toLowerCase().replace(/\s+/g, '-'), label, category, quantity, reason, owned: false }
}

function addOwned(list: PackingListItem[], items: WardrobeItem[], category: string, reason: string, usedIds: Set<string>) {
  for (const item of items) {
    const id = itemId(item)
    if (usedIds.has(id)) continue
    usedIds.add(id)
    list.push(ownedEntry(item, category, reason))
  }
}

export function generatePackingList(input: { wardrobe: WardrobeItem[]; days: number; travelStyle: string; activities: string[]; weather: TravelDayWeather[] }) {
  const hotDays = input.weather.filter((day) => day.temperature >= 28).length
  const rainDays = input.weather.filter((day) => day.rain >= 45 || day.condition.includes('rain')).length
  const coldDays = input.weather.filter((day) => day.temperature <= 14).length
  const formal = /business|conference|wedding|formal/.test(input.travelStyle) || input.activities.some((item) => /meeting|dinner|wedding|conference/i.test(item))
  const beach = /beach/.test(input.travelStyle) || input.activities.some((item) => /beach|swim/i.test(item))
  const adventure = /adventure|backpacking|hike|road trip/.test(input.travelStyle) || input.activities.some((item) => /hike|trek|adventure|walk|gym|workout/i.test(item))
  const gym = adventure || input.activities.some((item) => /gym|workout|run|training|yoga/i.test(item))
  const context = { travelStyle: input.travelStyle, activities: input.activities, weather: input.weather }
  const usedIds = new Set<string>()
  const list: PackingListItem[] = []
  const topsNeeded = Math.min(input.days <= 5 ? input.days : 9, Math.max(2, Math.ceil(input.days * 0.65)))
  const bottomsNeeded = Math.min(hotDays > input.days / 2 ? 4 : 3, Math.max(2, Math.ceil(input.days / 4)))
  const shoesNeeded = Math.min(formal || adventure ? 3 : 2, Math.max(1, Math.ceil(input.days / 8)))
  const jacketNeeded = rainDays || coldDays ? 2 : input.days > 3 ? 1 : 0

  addOwned(list, pick(input.wardrobe, topCategories, topsNeeded, usedIds, context), 'Tops', 'Chosen for high outfit coverage without packing a fresh top for every single day.', usedIds)
  addOwned(list, pick(input.wardrobe, hotDays > input.days / 2 ? ['shorts', 'jeans', 'cargo', 'skirt'] : bottomCategories, bottomsNeeded, usedIds, context), 'Bottoms', 'Repeatable bottoms keep the bag light while still changing the outfit shape.', usedIds)
  addOwned(list, pick(input.wardrobe, shoeCategories, shoesNeeded, usedIds, context), 'Shoes', 'Versatile footwear selected for repeat wear across activities.', usedIds)
  addOwned(list, pick(input.wardrobe, jacketCategories, jacketNeeded, usedIds, context), 'Jackets', rainDays ? 'Rain or wind is possible, so one weather-aware layer earns space.' : 'A light layer covers travel days and cooler evenings.', usedIds)
  addOwned(list, pick(input.wardrobe, accessoryCategories, 3, usedIds, context), 'Accessories', 'Small pieces add variety without adding much bulk.', usedIds)

  if (formal) {
    addOwned(list, pick(input.wardrobe, ['shirt', 'jacket', 'dress', 'skirt', 'blouse', 'kurti', 'saree', 'heels', 'boots'], 3, usedIds, context), 'Formal wear', 'Reserved for meetings, dinners, weddings, or conference settings.', usedIds)
  }
  if (gym) {
    addOwned(list, pick(input.wardrobe, ['tshirt', 'shorts', 'sneakers', 'hoodie'], 3, usedIds, context), 'Gym wear', 'Covers workouts, hikes, active sightseeing, or long walking days.', usedIds)
  }

  const hasOwned = (category: string, matcher: RegExp) => list.some((item) => item.category === category && matcher.test(item.label))
  if (topsNeeded && !list.some((item) => item.category === 'Tops')) list.push(essential('Versatile Tops', 'Missing Essentials', Math.min(3, topsNeeded), 'Your wardrobe does not have enough packable tops for this itinerary.'))
  if (bottomsNeeded && !list.some((item) => item.category === 'Bottoms')) list.push(essential(hotDays ? 'Shorts or Light Bottoms' : 'Neutral Bottoms', 'Missing Essentials', 2, 'Repeatable bottoms are needed for outfit rotation.'))
  if (!list.some((item) => item.category === 'Shoes')) list.push(essential(adventure ? 'Travel Shoes' : 'Comfortable Sneakers', 'Missing Essentials', 1, 'Footwear is required for daily outfits and transport days.'))
  if (formal && !hasOwned('Formal wear', /shirt|jacket|blazer|dress|heel|boot|kurti|saree/i)) list.push(essential('Formal Outfit Anchor', 'Missing Essentials', 1, 'Needed for business, wedding, or conference plans.'))
  if (rainDays && !list.some((item) => /rain|jacket|coat|boot|water/i.test(item.label))) list.push(essential('Rain Jacket', 'Missing Essentials', 1, 'Rain is expected during the trip and uncovered outfits need protection.'))
  if (rainDays && !list.some((item) => /boot|sneaker|shoe|water/i.test(item.label))) list.push(essential('Waterproof Shoes', 'Missing Essentials', 1, 'Wet days are easier with covered shoes that can handle walking.'))
  if (formal && !list.some((item) => /belt/i.test(item.label))) list.push(essential('Formal Belt', 'Missing Essentials', 1, 'It completes business or conference outfits and keeps formal looks intentional.'))
  if (adventure && !list.some((item) => /backpack|tote|bag/i.test(item.label))) list.push(essential('Travel Backpack', 'Missing Essentials', 1, 'Helpful for long walking days, transport, and carrying layers.'))
  if (beach) list.push(essential('Swimwear', 'Travel essentials', 1, 'Needed for beach or pool activities.'))
  list.push(
    essential('Undergarments', 'Undergarments', input.days + 1, 'Pack one per day plus one backup.'),
    essential('Sleepwear', 'Sleepwear', Math.max(1, Math.ceil(input.days / 4)), 'Comfortable night rotation.'),
    essential('Charger', 'Travel essentials', 1, 'Essential for travel.'),
    essential('Passport / ID', 'Travel essentials', 1, 'Required for transport and hotel check-in.'),
    essential('Sunglasses', 'Travel essentials', 1, 'Useful for UV and daytime sightseeing.')
  )
  return list
}
