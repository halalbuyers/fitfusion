import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import Clothing from '../../../models/Clothing'
import { connectToDatabase } from '../../../lib/mongodb'
import { generateGeminiText, hasGemini } from '../../../ai/gemini'
import type { WardrobeItem } from '../../../lib/fashion'
import { ensureNaturalLanguageResponse, generateStylistAdvice, generateStylistResponse } from '../../../lib/local-stylist'

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
    const localResponse = generateStylistResponse({ message: prompt, wardrobe })
    const localReply = localResponse.reply

    if (!hasGemini()) {
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
    return res.status(200).json({
      reply,
      outfitCard: localResponse.outfitCard,
      intent: localResponse.intent,
      method: reply === localReply ? 'local' : 'hybrid'
    })
  } catch (error: any) {
    return res.status(200).json({
      reply: generateStylistAdvice(),
      method: 'local'
    })
  }
}
