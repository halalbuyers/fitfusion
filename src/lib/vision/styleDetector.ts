import { normalizeStyle } from '../fashion-analysis'

export function detectVisionStyle(input: { category?: string; material?: string; pattern?: string; tags?: string[]; aiStyle?: string }) {
  const text = [input.category, input.material, input.pattern, input.aiStyle, ...(input.tags || [])].filter(Boolean).join(' ').toLowerCase()
  if (/quiet|cashmere|linen|old money|old-money/.test(text)) return 'old-money'
  if (/luxury|premium|silk|wool|leather/.test(text)) return 'formal'
  if (/korean|minimal|clean/.test(text)) return 'minimal'
  if (/street|oversized|graphic|cargo/.test(text)) return 'streetwear'
  if (/sport|gym|performance|running/.test(text)) return 'sporty'
  if (/tech|nylon|utility/.test(text)) return 'techwear'
  if (/vintage|washed|retro/.test(text)) return 'vintage'
  if (/y2k|baby tee|baggy/.test(text)) return 'y2k'
  return normalizeStyle(input.aiStyle)
}

