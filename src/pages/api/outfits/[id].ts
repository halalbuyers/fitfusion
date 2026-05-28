import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Outfit from '../../../models/Outfit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' })

  const outfit = await Outfit.findOne({ _id: id, userId })
  if (!outfit) return res.status(404).json({ error: 'Outfit not found' })

  if (req.method === 'GET') {
    await outfit.populate('items.clothing')
    return res.status(200).json(outfit)
  }

  if (req.method === 'PATCH') {
    const allowed = ['title', 'occasion', 'isFavorite', 'plannedFor', 'tags', 'explanation']
    for (const key of allowed) {
      if (key in req.body) outfit.set(key, req.body[key])
    }
    await outfit.save()
    return res.status(200).json(outfit)
  }

  if (req.method === 'DELETE') {
    await outfit.deleteOne()
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
