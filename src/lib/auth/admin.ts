import type { NextApiRequest } from 'next'
import { auth, clerkClient, currentUser, getAuth } from '@clerk/nextjs/server'

export type UserRole = 'user' | 'admin'

function roleFromMetadata(metadata?: unknown): UserRole {
  const role = typeof metadata === 'object' && metadata && 'role' in metadata
    ? String((metadata as { role?: unknown }).role || '').toLowerCase()
    : 'user'
  return role === 'admin' ? 'admin' : 'user'
}

export function hasAdminRole(claimsOrUser?: any) {
  const publicMetadata = claimsOrUser?.publicMetadata || claimsOrUser?.metadata?.publicMetadata
  return roleFromMetadata(publicMetadata) === 'admin'
}

export async function isAdmin(req?: NextApiRequest) {
  if (req) {
    const session = getAuth(req)
    if (!session.userId) return false
    if (hasAdminRole(session.sessionClaims)) return true

    try {
      const client = await clerkClient()
      const user = await client.users.getUser(session.userId)
      return hasAdminRole(user)
    } catch {
      return false
    }
  }

  const session = await auth()
  if (!session.userId) return false
  if (hasAdminRole(session.sessionClaims)) return true

  try {
    const user = await currentUser()
    return hasAdminRole(user)
  } catch {
    return false
  }
}
