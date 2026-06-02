import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import { EMBEDDING_VERSION, generateClothingEmbedding } from '../../../lib/embedding-engine'
import { buildConfirmedClothingPayload } from '../../../lib/wardrobe-confirmation'
import { recordTrainingExample } from '../../../lib/training-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const auth = getAuth(req)
  const userId = auth.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (!req.body?.image) return res.status(400).json({ error: 'Image is required' })

  try {
    await connectToDatabase()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  const payload = buildConfirmedClothingPayload({
    ...req.body,
    userId
  })
  const payloadWithEmbedding = {
    ...payload,
    embedding: generateClothingEmbedding(payload),
    embeddingVersion: EMBEDDING_VERSION
  }

  console.log('MONGODB SAVE COLORS:', {
    primaryColor: payloadWithEmbedding.primaryColor,
    colors: payloadWithEmbedding.colors,
    correctedByUser: payloadWithEmbedding.correctedByUser
  })

  const clothing = await Clothing.create(payloadWithEmbedding)
  if (payloadWithEmbedding.correctedByUser) {
    await recordTrainingExample({
      userId,
      imageUrl: payloadWithEmbedding.image,
      aiCategory: payloadWithEmbedding.aiCategory,
      userCategory: payloadWithEmbedding.category,
      aiColor: payloadWithEmbedding.aiColor,
      userColor: payloadWithEmbedding.primaryColor,
      aiStyle: req.body?.aiStyle || req.body?.style,
      userStyle: payloadWithEmbedding.style
    }).catch(() => null)
  }
  return res.status(201).json({ clothing, persisted: true })
}
