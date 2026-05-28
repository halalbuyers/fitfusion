import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../../../lib/mongodb'
import Clothing from '../../../models/Clothing'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase()
  } catch (error: any) {
    if (req.method === 'GET') {
      return res.status(404).json({ error: 'Not found' })
    }
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  const auth = getAuth(req)
  const userId = auth.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' })

  const item = await Clothing.findById(id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  if (String(item.userId) !== userId) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') return res.status(200).json(item)

  if (req.method === 'PATCH') {
    Object.assign(item, req.body)
    await item.save()
    return res.status(200).json(item)
  }

  if (req.method === 'DELETE') {
    await item.deleteOne()
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
