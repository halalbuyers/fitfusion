import CalendarOutfit from '../../models/CalendarOutfit'
import Clothing from '../../models/Clothing'
import { getStylistMemory } from './memoryEngine'
import { parseStylistConversation } from './conversationEngine'
import type { StylistChatMessage, StylistContextBundle } from './types'

export async function buildStylistContext(input: {
  userId: string
  prompt: string
  messages?: StylistChatMessage[]
  weather?: { temperature?: number; condition?: string; suggestion?: string; source?: string }
}): Promise<StylistContextBundle> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(tomorrow)
  end.setHours(23, 59, 59, 999)
  const [wardrobe, memory, calendar] = await Promise.all([
    Clothing.find({ userId: input.userId }).sort({ isFavorite: -1, itemPreferenceScore: -1, createdAt: -1 }).limit(1000).lean().catch(() => []),
    getStylistMemory(input.userId),
    CalendarOutfit.find({ userId: input.userId, date: { $gte: start, $lte: end } }).sort({ date: 1 }).limit(4).lean().catch(() => [])
  ])
  return {
    userId: input.userId,
    wardrobe: wardrobe as any[],
    memory,
    conversation: parseStylistConversation(input.userId, input.prompt, input.messages || []),
    weather: input.weather,
    calendar: calendar as any[]
  }
}

