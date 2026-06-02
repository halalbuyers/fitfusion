import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { generateGeminiText, hasGemini } from '../../../ai/gemini'
import { generateStylistAdvice } from '../../../lib/local-stylist'

function localExplanation(outfit: any, occasion?: string, weather?: string) {
  return generateStylistAdvice({ outfit, occasion: occasion || outfit?.occasion || 'casual', weather })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { outfit, occasion, weather } = req.body || {}
  if (!outfit) return res.status(400).json({ error: 'Outfit is required' })

  if (!hasGemini()) return res.status(200).json({ explanation: localExplanation(outfit), method: 'local' })

  try {
    const prompt = `Explain why this already-generated outfit works. Do not suggest replacing items unless advice is explicitly useful.
Occasion: ${occasion || outfit.occasion || 'casual'}
Weather: ${weather || 'moderate'}
Outfit JSON: ${JSON.stringify(outfit).slice(0, 4000)}
Return one concise paragraph.`
    const explanation = await generateGeminiText(prompt, 'You are FitFusion, a practical AI stylist. Explain scored outfits; do not generate random combinations.')
    return res.status(200).json({ explanation: explanation.trim(), method: 'hybrid' })
  } catch {
    return res.status(200).json({ explanation: localExplanation(outfit), method: 'local' })
  }
}
