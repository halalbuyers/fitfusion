import type { NextApiRequest } from 'next'
import { auth, clerkClient, getAuth } from '@clerk/nextjs/server'

export type UserRole = 'user' | 'moderator' | 'admin'
type AdminAuthInput = NextApiRequest | { userId?: string | null; sessionClaims?: unknown }

function roleFromMetadata(metadata?: unknown): UserRole {
  const role = typeof metadata === 'object' && metadata && 'role' in metadata
    ? String((metadata as { role?: unknown }).role || '').toLowerCase()
    : 'user'
  if (role === 'admin' || role === 'moderator') return role
  return 'user'
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

    const { userId } = session

    if (!userId) return false

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const role = roleFromMetadata(user.publicMetadata)

    return role === 'admin'
  } catch {
    return false
  }
}
