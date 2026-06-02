import type { NextApiRequest } from 'next'
import { auth, clerkClient, getAuth } from '@clerk/nextjs/server'

export type UserRole = 'user' | 'admin'
type AdminAuthInput = NextApiRequest | { userId?: string | null; sessionClaims?: unknown }

function roleFromMetadata(metadata?: unknown): UserRole {
  const role = typeof metadata === 'object' && metadata && 'role' in metadata
    ? String((metadata as { role?: unknown }).role || '').toLowerCase()
    : 'user'
  return role === 'admin' ? 'admin' : 'user'
}

function isApiRequest(input?: AdminAuthInput): input is NextApiRequest {
  return Boolean(input && 'headers' in input && 'method' in input)
}

export async function isAdmin(input?: AdminAuthInput) {
  try {
    const session = isApiRequest(input)
      ? getAuth(input)
      : input?.userId !== undefined
        ? { userId: input.userId, sessionClaims: input.sessionClaims }
        : await auth()

    const { userId, sessionClaims } = session
    console.log('USER ID:', userId)
    console.log('SESSION CLAIMS:', sessionClaims)

    if (!userId) return false

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const role = roleFromMetadata(user.publicMetadata)

    console.log('PUBLIC METADATA:', user?.publicMetadata)
    console.log('ROLE:', role)

    return role === 'admin'
  } catch (error) {
    console.log('USER ID:', null)
    console.log('SESSION CLAIMS:', null)
    console.log('PUBLIC METADATA:', null)
    console.log('ROLE:', 'user')
    console.error('Admin role lookup failed:', error)
    return false
  }
}
