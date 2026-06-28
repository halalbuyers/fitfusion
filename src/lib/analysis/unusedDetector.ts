import type { AnalysisWardrobeItem } from './types'

export type UnusedWardrobeItem = {
  item: AnalysisWardrobeItem
  daysUnused: number
  timesWorn: number
  action: 'wear' | 'donate' | 'sell'
  reason: string
}

export function detectUnusedItems(items: AnalysisWardrobeItem[], now = Date.now()): UnusedWardrobeItem[] {
  return items.map((item) => {
    const timesWorn = Number(item.wearCount || item.usageCount || 0)
    const last = item.lastWornAt ? new Date(item.lastWornAt).getTime() : 0
    const created = item.createdAt ? new Date(item.createdAt).getTime() : now
    const baseline = last || created
    const daysUnused = Math.max(0, Math.floor((now - baseline) / 86400000))
    const action: UnusedWardrobeItem['action'] = daysUnused >= 90 && timesWorn <= 1 ? 'sell' : daysUnused >= 60 ? 'donate' : 'wear'
    return {
      item,
      daysUnused,
      timesWorn,
      action,
      reason: daysUnused >= 90 ? 'Unused for 90+ days.' : daysUnused >= 60 ? 'Unused for 60+ days.' : 'Bring this back into rotation.'
    }
  }).filter((entry) => entry.daysUnused >= 30 || entry.timesWorn === 0).sort((a, b) => b.daysUnused - a.daysUnused).slice(0, 12)
}

