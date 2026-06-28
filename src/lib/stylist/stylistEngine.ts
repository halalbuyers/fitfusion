import { normalizeCategory } from '../fashion-analysis'
import { ensureNaturalLanguageResponse } from '../local-stylist'
import { generateGeminiText, hasGemini } from '../../ai/gemini'
import { generateDailyOutfit } from './dailyOutfit'
import { buildStylistContext } from './contextEngine'
import { fashionTeachingPoint, memoryNudge, stylistTone } from './personalityEngine'
import { outfitSummary, recommendFromWardrobe, wardrobeRealityCheck } from './recommendationEngine'
import { generateWeeklyStyleReport } from './weeklyReport'
import type { StylistChatMessage, StylistContextBundle, StylistOutfitCard, StylistV2Response } from './types'

function titleCase(value?: string) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function itemLabel(item: any) {
  const color = item.primaryColor || item.color || item.colors?.[0]
  const brand = item.brand ? `${titleCase(item.brand)} ` : ''
  return `${brand}${color && color !== 'unknown' ? `${titleCase(color)} ` : ''}${titleCase(item.category || 'item')}`.trim()
}

function roleFor(item: any) {
  const category = normalizeCategory(item.category)
  if (['tshirt', 'shirt', 'hoodie', 'blouse', 'dress', 'kurti', 'saree'].includes(category)) return 'top'
  if (['jacket'].includes(category) || /blazer|coat|layer/i.test(String(item.category || ''))) return 'layer'
  if (['jeans', 'cargo', 'shorts', 'skirt'].includes(category) || /trouser|chino|pant/i.test(String(item.category || ''))) return 'bottom'
  if (['sneakers', 'boots', 'heels'].includes(category) || /shoe|loafer|sandal/i.test(String(item.category || ''))) return 'shoes'
  return 'accessory'
}

function cardFromOutfit(outfit: NonNullable<ReturnType<typeof recommendFromWardrobe>>, bundle: StylistContextBundle): StylistOutfitCard {
  const items = outfit.items.map((item: any) => ({
    id: String(item._id || item.id || ''),
    label: itemLabel(item),
    role: roleFor(item),
    image: item.image,
    category: item.category,
    color: item.primaryColor || item.color || item.colors?.[0]
  }))
  const top = items.find((item) => item.role === 'top') || items.find((item) => item.role === 'layer')
  const bottom = items.find((item) => item.role === 'bottom')
  const shoes = items.find((item) => item.role === 'shoes')
  const summary = outfitSummary(outfit)
  return {
    top: top?.label || 'Add a top from your wardrobe',
    bottom: bottom?.label || 'Add a bottom from your wardrobe',
    shoes: shoes?.label || 'Add shoes from your wardrobe',
    style: titleCase(bundle.conversation.styleGoal || outfit.title || bundle.memory.preferredStyle),
    reason: `${outfit.explanation} ${fashionTeachingPoint({ colors: summary.colors, hasLayer: summary.hasLayer, occasion: bundle.conversation.occasion, weather: bundle.weather?.condition })}`,
    score: outfit.score,
    items,
    missing: wardrobeRealityCheck(bundle).missing.map((item) => ({
      title: item.title,
      estimatedNewCombinations: item.estimatedCombinationIncrease,
      estimatedImprovementPercent: Math.min(99, Math.max(1, Math.round(item.estimatedCombinationIncrease / Math.max(1, bundle.wardrobe.length))))
    })),
    followUps: ['Make it more formal', 'Change the shoes', 'Use blue instead']
  }
}

function suggestedQuestions(bundle: StylistContextBundle) {
  const base = [
    'What should I wear today?',
    'Create a luxury outfit.',
    'Help me pack for a trip.',
    'Style my black hoodie.',
    'What am I missing?',
    'Show my least worn clothes.'
  ]
  if (bundle.memory.favoriteColors[0]) base.unshift(`Use ${bundle.memory.favoriteColors[0]} today.`)
  return [...new Set(base)].slice(0, 6)
}

function missingReply(bundle: StylistContextBundle) {
  const reality = wardrobeRealityCheck(bundle)
  if (!reality.missing.length) return 'Your wardrobe has the core essentials covered. The next upgrade should be texture or color variety, not more basics.'
  const top = reality.missing[0]
  return `You do not currently own ${top.title.toLowerCase()}. Adding it would unlock about ${top.estimatedCombinationIncrease} new outfit combinations. I would prioritize it because it improves variety without pushing you away from your existing style.`
}

function leastWornReply(bundle: StylistContextBundle) {
  const least = [...bundle.wardrobe]
    .sort((a, b) => Number(a.wearCount || a.usageCount || 0) - Number(b.wearCount || b.usageCount || 0))
    .slice(0, 4)
  if (!least.length) return 'I do not have enough wardrobe history yet. Once you save or wear outfits, I can show the pieces that need rotation.'
  return `Your least worn pieces are ${least.map(itemLabel).join(', ')}. Try styling the first one this week before deciding whether to donate or sell it.`
}

function localReplyFor(bundle: StylistContextBundle, card?: StylistOutfitCard) {
  if (bundle.conversation.intent === 'weekly-report') return generateWeeklyStyleReport(bundle)
  if (bundle.conversation.intent === 'missing') return missingReply(bundle)
  if (bundle.conversation.intent === 'least-worn') return leastWornReply(bundle)
  if (!card) {
    const reality = wardrobeRealityCheck(bundle)
    if (!reality.completeBase) return 'I need a real top, bottom, and shoes in your wardrobe before I can style a complete outfit. I can suggest purchases, but I will not pretend you own pieces that are missing.'
    return 'I could not build a clean outfit from the current constraints. Try relaxing the color, weather, or occasion request.'
  }
  const intro = stylistTone(bundle.conversation.prompt)
  const memory = memoryNudge(bundle.memory)
  const refinement = bundle.conversation.intent === 'refinement' ? 'I adjusted only the requested part and kept the rest of the look consistent.' : ''
  return [intro, memory, refinement, `Wear ${card.top} with ${card.bottom} and ${card.shoes}.`, card.reason].filter(Boolean).join(' ')
}

function memorySummary(bundle: StylistContextBundle) {
  const pieces = [
    bundle.memory.favoriteColors[0] ? `favorite color: ${bundle.memory.favoriteColors[0]}` : '',
    bundle.memory.favoriteCategories[0] ? `favorite category: ${bundle.memory.favoriteCategories[0]}` : '',
    bundle.memory.preferredStyle ? `style: ${bundle.memory.preferredStyle}` : '',
    `${bundle.memory.wardrobeSize} wardrobe items`
  ].filter(Boolean)
  return pieces.join(' · ')
}

export async function generatePersonalStylistResponse(input: {
  userId: string
  prompt: string
  messages?: StylistChatMessage[]
  weather?: { temperature?: number; condition?: string; suggestion?: string; source?: string }
}): Promise<StylistV2Response> {
  const bundle = await buildStylistContext(input)
  const outfit = bundle.conversation.intent === 'daily' ? generateDailyOutfit(bundle) : recommendFromWardrobe(bundle)
  const card = outfit ? cardFromOutfit(outfit, bundle) : undefined
  const localReply = localReplyFor(bundle, card)
  const suggestions = suggestedQuestions(bundle)

  if (!hasGemini()) {
    return { reply: localReply, intent: bundle.conversation.intent, method: 'local-v2', outfitCard: card, suggestions, memorySummary: memorySummary(bundle) }
  }

  const inventory = bundle.wardrobe.slice(0, 120).map((item: any) => `${itemLabel(item)} (${item.style || 'style'}, ${item.season || 'all-season'})`).join('; ')
  const conversation = (input.messages || []).slice(-8).map((message) => `${message.role}: ${message.content}`).join('\n')
  let aiText = ''
  try {
    aiText = await generateGeminiText(
      `${conversation}\nuser: ${input.prompt}\n\nLocal wardrobe-safe answer:\n${localReply}`,
      `You are Noir Closet, a luxury personal fashion consultant. Be concise, warm, confident, and non-repetitive. You may only recommend owned wardrobe items from this inventory: ${inventory || 'empty wardrobe'}. If something is missing, say it is missing and frame it as a purchase suggestion. User memory: ${memorySummary(bundle)}. Explain color harmony, layering, fabric, season, and occasion only when useful. Never output JSON or markdown code.`
    )
  } catch {
    aiText = localReply
  }
  const reply = ensureNaturalLanguageResponse(aiText || localReply, localReply)
  return { reply, intent: bundle.conversation.intent, method: reply === localReply ? 'local-v2' : 'hybrid-v2', outfitCard: card, suggestions, memorySummary: memorySummary(bundle) }
}
