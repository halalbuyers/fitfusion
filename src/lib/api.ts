import type { NextApiResponse } from 'next'

export function ok<T>(res: NextApiResponse, data: T, status = 200) {
  return res.status(status).json(data)
}

export function fail(res: NextApiResponse, message: string, status = 400) {
  return res.status(status).json({ error: message })
}

export function requireMethod(method: string | undefined, allowed: string[]) {
  return method ? allowed.includes(method) : false
}

export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}
