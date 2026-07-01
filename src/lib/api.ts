import type { NextApiResponse } from 'next'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export function ok<T>(res: NextApiResponse, data: T, status = 200) {
  return res.status(status).json(data)
}

export function fail(res: NextApiResponse, message: string, status = 400) {
  return res.status(status).json({ error: message })
}

export function apiOk<T>(res: NextApiResponse, data: T, status = 200) {
  return res.status(status).json({ success: true, data } satisfies ApiResponse<T>)
}

export function apiFail(res: NextApiResponse, message: string, status = 400) {
  return res.status(status).json({ success: false, error: message } satisfies ApiResponse<never>)
}

export async function readApiJson<T>(res: Response, fallbackMessage = 'Something went wrong') {
  if (!res.ok) {
    let errorMessage = fallbackMessage

    try {
      const error = await res.clone().json() as { error?: string; message?: string }
      errorMessage = error.error || error.message || errorMessage
    } catch {
      errorMessage = await res.text().catch(() => errorMessage) || errorMessage
    }

    throw new Error(errorMessage)
  }

  let payload: ApiResponse<T> | T

  try {
    payload = await res.json()
  } catch {
    throw new Error(fallbackMessage)
  }

  const envelope = payload as ApiResponse<T>
  if (envelope && typeof envelope === 'object' && 'success' in envelope) {
    if (envelope.success === false) throw new Error(envelope.error || fallbackMessage)
    return envelope.data as T
  }

  return payload as T
}

export function requireMethod(method: string | undefined, allowed: string[]) {
  return method ? allowed.includes(method) : false
}

export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}
