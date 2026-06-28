import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import AiRequestLog from '../../../models/AiRequestLog'
import { generateStylistAdvice } from '../../../lib/local-stylist'
import { generatePersonalStylistResponse } from '../../../lib/stylist/stylistEngine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const started = Date.now()
    if (req.method !== 'POST') return res.status(405).end()

    const auth = getAuth(req)
    const userId = auth.userId || req.body.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const messages = Array.isArray(req.body.messages) ? req.body.messages : []
    const prompt = String(req.body.message || messages[messages.length - 1]?.content || 'Give me a wardrobe-aware styling suggestion.')
    await connectToDatabase()
    const stylist = await generatePersonalStylistResponse({
      userId,
      prompt,
      messages,
      weather: req.body.weather
    })
    await AiRequestLog.create({
      userId,
      kind: 'stylist',
      provider: stylist.method.includes('hybrid') ? 'gemini' : 'local',
      status: stylist.method.includes('hybrid') ? 'success' : 'fallback',
      responseTimeMs: Date.now() - started
    }).catch(() => null)
    return res.status(200).json({
      reply: stylist.reply,
      outfitCard: stylist.outfitCard,
      intent: stylist.intent,
      method: stylist.method,
      suggestions: stylist.suggestions,
      memorySummary: stylist.memorySummary
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
