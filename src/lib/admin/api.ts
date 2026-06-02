import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { connectToDatabase } from '../mongodb'
import { isAdmin } from '../auth/admin'

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: 'Access Denied' })
    return null
  }
  await connectToDatabase()
  return { userId }
}

export function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers['x-forwarded-for']
  return Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.socket.remoteAddress
}
