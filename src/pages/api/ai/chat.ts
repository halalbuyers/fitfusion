import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import Clothing from '../../../models/Clothing'
import { connectToDatabase } from '../../../lib/mongodb'
import { generateGeminiText, hasGemini } from '../../../ai/gemini'
import { generateOutfits, type WardrobeItem } from '../../../lib/fashion'

function inferOccasion(text: string) {
  const value = text.toLowerCase()
  return ['date night', 'college', 'formal', 'party', 'travel', 'gym', 'casual'].find((item) => value.includes(item)) || 'casual'
}

function inferWeather(text: string) {
  const value = text.toLowerCase()
  if (value.includes('rain')) return 'rain'
  if (value.includes('cold') || value.includes('winter')) return 'cold'
  if (value.includes('hot') || value.includes('summer')) return 'hot'
  return 'moderate'
}

function formatItem(item: WardrobeItem) {
  const colors = item.colors?.length ? item.colors.join('/') : item.color || 'neutral'
  return `${colors} ${item.category}${item.style ? ` (${item.style})` : ''}`
}

function localStylistReply(message: string, wardrobe: WardrobeItem[]) {
  if (!wardrobe.length) {
    return [
      'I can help, but your wardrobe is empty right now.',
      'Upload at least one top, one bottom, and one pair of shoes. A strong starter capsule would be: black tee, blue jeans, white sneakers, one hoodie or jacket, and one accessory.',
      'Once those are in, I can generate ranked outfits locally even if AI is unavailable.'
    ].join('\n\n')
  }

  const occasion = inferOccasion(message)
  const weather = inferWeather(message)
  const outfits = generateOutfits(wardrobe, { occasion, weather }).slice(0, 3)
  const top = outfits[0]

  if (!top) {
    const categories = [...new Set(wardrobe.map((item) => item.category))].join(', ')
    return `You have ${wardrobe.length} saved pieces across ${categories || 'a few categories'}, but I need a complete base outfit to style properly. Add a top, bottom, and shoes, then ask again for a scored fit.`
  }

  const pieces = top.items.map(formatItem).join(' + ')
  const alternatives = outfits.slice(1).map((outfit, index) => `Option ${index + 2}: ${outfit.items.map(formatItem).join(' + ')} (${outfit.score}/100)`).join('\n')

  return [
    `For ${occasion} in ${weather} weather, wear: ${pieces}.`,
    `Score: ${top.score}/100. ${top.explanation}`,
    top.colorAnalysis,
    alternatives ? `Backup fits:\n${alternatives}` : '',
    'Stylist note: keep accessories minimal if the palette has more than three colors; add a jacket or hoodie when it is cold or rainy.'
  ].filter(Boolean).join('\n\n')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end()

    const auth = getAuth(req)
    const userId = auth.userId || req.body.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    let wardrobe: WardrobeItem[] = []
    try {
      await connectToDatabase()
      wardrobe = await Clothing.find({ userId }).limit(80).lean()
    } catch {
      wardrobe = []
    }
    const inventory = wardrobe.map((item) => `${item.category} in ${(item.colors || []).join(', ') || item.color}, ${item.style}`).join('; ')
    const messages = Array.isArray(req.body.messages) ? req.body.messages : []
    const prompt = String(req.body.message || messages[messages.length - 1]?.content || 'Give me a wardrobe-aware styling suggestion.')
    const localReply = localStylistReply(prompt, wardrobe)

    if (!hasGemini()) {
      return res.status(200).json({ reply: localReply, method: 'local' })
    }

    const userPrompt = messages
      .map((m: any) => `${m?.role || 'user'}: ${m?.content || ''}`)
      .join('\n')
      .trim()

    let responseText = ''
    try {
      responseText = await generateGeminiText(
        `${userPrompt || prompt}\n\nLocal FitFusion recommendation:\n${localReply}`,
        `You are FitFusion, a concise modern AI stylist. Use this wardrobe inventory when advising: ${inventory || 'No persisted wardrobe available'}. Never invent items. If the local recommendation is enough, refine it in a premium, practical tone.`
      )
    } catch {
      responseText = localReply
    }

    return res.status(200).json({ reply: responseText || localReply, method: responseText === localReply ? 'local' : 'hybrid' })
  } catch (error: any) {
    return res.status(200).json({
      reply: 'I could not reach the full stylist stack, so here is the reliable fallback: build around a neutral top, balanced bottom, clean shoes, and one weather-aware layer. Upload or tag more wardrobe items and I can score exact combinations.',
      method: 'fallback',
      warning: error?.message || 'Stylist fallback used'
    })
  }
}
