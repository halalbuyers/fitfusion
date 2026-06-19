import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'
import Outfit from '../../../models/Outfit'

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  res.setHeader('Vary', 'Cookie')
}

function isDatabaseUnavailable(error: unknown) {
  const message = String((error as Error)?.message || error || '')
  return (
    message.includes('ECONNREFUSED') ||
    message.includes('querySrv') ||
    message.includes('MONGODB_URI') ||
    message.includes('server selection') ||
    message.includes('timed out') ||
    message.includes('ENOTFOUND')
  )
}

async function findUserOutfits(userId: string) {
  try {
    // Ensure the referenced model is registered before populate runs in serverless bundles.
    void Clothing
    return await Outfit.find({ userId }).populate('items.clothing').sort({ createdAt: -1 }).lean()
  } catch {
    return Outfit.find({ userId }).sort({ createdAt: -1 }).lean()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res)

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  let userId: string | null = null
  try {
    userId = getAuth(req).userId
  } catch {
    if (req.method === 'GET') return res.status(200).json([])
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!userId) {
    if (req.method === 'GET') return res.status(200).json([])
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    await connectToDatabase()
  } catch (error) {
    if (req.method === 'GET') return res.status(200).json([])
    const status = isDatabaseUnavailable(error) ? 503 : 500
    return res.status(status).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  try {
    if (req.method === 'GET') {
      try {
        const outfits = await findUserOutfits(userId)
        return res.status(200).json(outfits)
      } catch {
        return res.status(200).json([])
      }
    }

    const outfit = await Outfit.create({ ...req.body, userId })
    return res.status(201).json(outfit)
  } catch (error: any) {
    if (isDatabaseUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
    }
    return res.status(500).json({ error: 'Failed to process outfits request.' })
  }
}
