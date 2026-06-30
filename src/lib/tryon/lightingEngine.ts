export const lightingOptions = ['golden hour', 'indoor', 'studio', 'night', 'soft light', 'natural daylight'] as const

export function normalizeLighting(value?: string) {
  const text = String(value || '').toLowerCase()
  return lightingOptions.find((item) => text.includes(item)) || 'studio'
}

export function lightingTreatment(value?: string) {
  const lighting = normalizeLighting(value)
  const map: Record<string, { overlay: string; prompt: string; contrast: number }> = {
    'golden hour': { overlay: 'bg-amber-300/10', prompt: 'warm golden hour highlights and soft long shadows', contrast: 8 },
    indoor: { overlay: 'bg-white/5', prompt: 'clean indoor lighting with realistic fabric texture', contrast: 3 },
    studio: { overlay: 'bg-white/8', prompt: 'high-end studio lighting with crisp garment edges', contrast: 7 },
    night: { overlay: 'bg-sky-400/10', prompt: 'night editorial lighting with controlled highlights', contrast: 12 },
    'soft light': { overlay: 'bg-white/6', prompt: 'soft diffused light with flattering skin tones', contrast: 2 },
    'natural daylight': { overlay: 'bg-cyan-200/8', prompt: 'natural daylight with accurate color rendering', contrast: 4 }
  }
  return { lighting, ...map[lighting] }
}
