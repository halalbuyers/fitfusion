import type { StylistChatMessage, StylistConversationContext, StylistConversationIntent } from './types'

const contextCache = new Map<string, { expires: number; context: StylistConversationContext }>()

function normalize(value?: string) {
  return String(value || '').trim().toLowerCase()
}

function detectIntent(text: string): StylistConversationIntent {
  if (/(weekly|week report|style report|insights)/.test(text)) return 'weekly-report'
  if (/(least worn|unused|never wear|not wearing)/.test(text)) return 'least-worn'
  if (/(missing|what am i missing|buy|purchase|add to wardrobe)/.test(text)) return 'missing'
  if (/(today|wear today|daily|now)/.test(text)) return 'daily'
  if (/(more formal|change the shoes|use blue|remove the jacket|oversized|make it)/.test(text)) return 'refinement'
  if (/(vacation|trip|pack|travel|flight|airport)/.test(text)) return 'trip'
  if (/(interview|presentation|meeting)/.test(text)) return 'interview'
  if (/(korean|seoul)/.test(text)) return 'korean'
  if (/(taller|height|longer legs)/.test(text)) return 'taller'
  if (/(luxury|old money|premium|rich)/.test(text)) return 'luxury'
  if (/(aesthetic|vibe|soft|clean girl|minimal)/.test(text)) return 'aesthetic'
  if (/(why|explain|teach|work)/.test(text)) return 'explain'
  return 'recommendation'
}

function occasionFor(text: string, intent: StylistConversationIntent) {
  if (intent === 'interview') return 'office'
  if (intent === 'trip') return 'travel'
  if (/(college|class|campus)/.test(text)) return 'college'
  if (/(office|work|interview|meeting)/.test(text)) return 'office'
  if (/(party|club)/.test(text)) return 'party'
  if (/(wedding|ceremony)/.test(text)) return 'wedding'
  if (/(gym|workout)/.test(text)) return 'gym'
  if (/(travel|vacation|airport|trip)/.test(text)) return 'travel'
  if (/(home|lounge)/.test(text)) return 'home'
  if (/(street|streetwear|korean)/.test(text)) return 'streetwear'
  return 'casual'
}

function styleGoalFor(text: string, intent: StylistConversationIntent) {
  if (intent === 'korean') return 'Korean minimal streetwear'
  if (intent === 'luxury') return 'quiet luxury'
  if (intent === 'taller') return 'height-lengthening proportions'
  if (intent === 'aesthetic') return 'clean aesthetic'
  if (/(monochrome|black)/.test(text)) return 'monochrome'
  if (/(oversized)/.test(text)) return 'oversized'
  return undefined
}

export function parseStylistConversation(userId: string, prompt: string, messages: StylistChatMessage[] = []): StylistConversationContext {
  const key = `${userId}:${messages.slice(-6).map((message) => `${message.role}:${message.content}`).join('|')}:${prompt}`
  const cached = contextCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.context
  const text = normalize([messages.slice(-2).map((message) => message.content).join(' '), prompt].join(' '))
  const intent = detectIntent(text)
  const context: StylistConversationContext = {
    prompt,
    messages: messages.slice(-10),
    intent,
    occasion: occasionFor(text, intent),
    styleGoal: styleGoalFor(text, intent),
    refinement: {
      moreFormal: /more formal|smarter|sharper/.test(text),
      changeShoes: /change the shoes|different shoes|swap shoes/.test(text),
      color: (text.match(/use (black|white|blue|navy|beige|grey|gray|brown|olive|green|red)/)?.[1] || '').replace('grey', 'gray') || undefined,
      removeLayer: /remove (the )?(jacket|layer|hoodie|coat)/.test(text),
      oversized: /oversized|baggy|relaxed/.test(text)
    }
  }
  contextCache.set(key, { expires: Date.now() + 60000, context })
  return context
}

