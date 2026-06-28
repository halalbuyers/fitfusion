export type RotationItem = {
  _id?: string
  id?: string
  image?: string
  wearCount?: number
  usageCount?: number
  lastWornAt?: Date | string | null
}

function itemId(item: RotationItem) {
  return String(item._id || item.id || item.image || '')
}

export function rotationPenaltyForItem(item: RotationItem, usage: Record<string, number> = {}) {
  const id = itemId(item)
  const useCount = Number(usage[id] ?? item.usageCount ?? item.wearCount ?? 0)
  let penalty = Math.min(18, useCount * 3)
  if (item.lastWornAt) {
    const days = (Date.now() - new Date(item.lastWornAt).getTime()) / 86400000
    if (!Number.isNaN(days)) {
      if (days <= 1) penalty += 24
      else if (days <= 2) penalty += 16
      else if (days <= 7) penalty += 7
    }
  }
  return Math.max(0, Math.round(penalty))
}

export function scoreRotation(items: RotationItem[], options: { usage?: Record<string, number>; recentlySuggested?: string[] } = {}) {
  const recentlySuggested = new Set(options.recentlySuggested || [])
  const penalty = items.reduce((sum, item) => sum + rotationPenaltyForItem(item, options.usage), 0) / Math.max(1, items.length)
  const exactPenalty = items.some((item) => recentlySuggested.has(itemId(item))) ? 10 : 0
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty - exactPenalty)))
  return { score, penalty: Math.round(100 - score) }
}

export function weightedRandomRank<T>(items: T[], weight: (item: T) => number) {
  return [...items]
    .map((item) => ({ item, ticket: Math.random() ** (1 / Math.max(0.01, weight(item))) }))
    .sort((a, b) => b.ticket - a.ticket)
    .map((entry) => entry.item)
}

