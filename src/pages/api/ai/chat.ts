import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import Clothing from '../../../models/Clothing'
import { connectToDatabase } from '../../../lib/mongodb'
import AiRequestLog from '../../../models/AiRequestLog'
import { generateGeminiText, hasGemini } from '../../../ai/gemini'
import type { WardrobeItem } from '../../../lib/fashion'
import { ensureNaturalLanguageResponse, generateStylistAdvice, generateStylistResponse } from '../../../lib/local-stylist'
import { getPersonalizationProfile } from '../../../lib/personalization-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const started = Date.now()
    if (req.method !== 'POST') return res.status(405).end()

    const auth = getAuth(req)
    const userId = auth.userId || req.body.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    let wardrobe: WardrobeItem[] = []
    let preferences = null
    try {
      await connectToDatabase()
      wardrobe = await Clothing.find({ userId }).limit(80).lean()
      preferences = await getPersonalizationProfile(userId).catch(() => null)
    } catch {
      wardrobe = []
    }
    const inventory = wardrobe.map((item) => `${item.category} in ${(item.colors || []).join(', ') || item.color}, ${item.style}`).join('; ')
    const messages = Array.isArray(req.body.messages) ? req.body.messages : []
    const prompt = String(req.body.message || messages[messages.length - 1]?.content || 'Give me a wardrobe-aware styling suggestion.')
    const localResponse = generateStylistResponse({ message: prompt, wardrobe, preferences: preferences || undefined })
    const localReply = localResponse.reply

    if (!hasGemini()) {
      await AiRequestLog.create({ userId, kind: 'stylist', provider: 'local', status: 'fallback', responseTimeMs: Date.now() - started }).catch(() => null)
      return res.status(200).json({ reply: localReply, outfitCard: localResponse.outfitCard, intent: localResponse.intent, method: 'local' })
    }

    const userPrompt = messages
      .map((m: any) => `${m?.role || 'user'}: ${m?.content || ''}`)
      .join('\n')
      .trim()

    let responseText = ''
    try {
      responseText = await generateGeminiText(
        `${userPrompt || prompt}\n\nLocal FitFusion recommendation:\n${localReply}`,
        `You are FitFusion, a concise modern AI stylist. Use this wardrobe inventory when advising: ${inventory || 'No persisted wardrobe available'}. Never invent items. Return only natural conversational prose. Never return JSON, objects, arrays, markdown code fences, or stringified data. If the local recommendation is enough, refine it in a premium, practical tone.`
      )
    } catch {
      responseText = localReply
    }

    const reply = ensureNaturalLanguageResponse(responseText || localReply, localReply)
    await AiRequestLog.create({
      userId,
      kind: 'stylist',
      provider: reply === localReply ? 'local' : 'gemini',
      status: reply === localReply ? 'fallback' : 'success',
      responseTimeMs: Date.now() - started
    }).catch(() => null)
    return res.status(200).json({
      reply,
      outfitCard: localResponse.outfitCard,
      intent: localResponse.intent,
      method: reply === localReply ? 'local' : 'hybrid'
    })
  } catch (error: any) {
    const userId = getAuth(req).userId || req.body?.userId
    if (userId) {
      await connectToDatabase().then(() => AiRequestLog.create({ userId, kind: 'stylist', provider: 'local', status: 'failed' })).catch(() => null)
    }
    return res.status(200).json({
      reply: generateStylistAdvice(),
      method: 'local'
    })
  }
}
