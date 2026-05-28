import type { NextApiRequest, NextApiResponse } from 'next'
import { analyzeImage as analyzeImageWithOpenAI } from '../../../ai/openai'

export async function analyzeImage(imageUrl: string) {
  try {
    const analysis = await analyzeImageWithOpenAI(imageUrl)
    return analysis
  } catch (e) {
    return { category: 'unknown', colors: [], style: '', season: '', tags: [] }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { imageUrl } = req.body
  if (!imageUrl) return res.status(400).json({ error: 'No imageUrl provided' })

  const analysis = await analyzeImage(imageUrl)
  return res.status(200).json({ analysis })
}
