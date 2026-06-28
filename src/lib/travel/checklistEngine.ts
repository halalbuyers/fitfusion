import type { PackingListItem } from './packingEngine'

export function buildChecklist(items: PackingListItem[]) {
  return items.map((item, index) => ({
    id: `${item.id || item.label}-${index}`.toLowerCase().replace(/\s+/g, '-'),
    label: item.label,
    category: item.category,
    quantity: item.quantity,
    reason: item.reason,
    packed: false
  }))
}

export function checklistProgress(items: Array<{ packed?: boolean }>) {
  const total = items.length
  const packed = items.filter((item) => item.packed).length
  return { total, packed, percent: total ? Math.round((packed / total) * 100) : 0 }
}
