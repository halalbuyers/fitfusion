export const backgroundOptions = ['luxury store', 'street', 'office', 'coffee shop', 'beach', 'airport', 'home', 'studio'] as const

export function normalizeBackground(value?: string) {
  const text = String(value || '').toLowerCase()
  return backgroundOptions.find((item) => text.includes(item)) || 'studio'
}

export function backgroundTreatment(value?: string) {
  const background = normalizeBackground(value)
  const map: Record<string, { gradient: string; prompt: string; depth: string }> = {
    'luxury store': { gradient: 'from-[#111111] via-[#232016] to-[#090909]', prompt: 'quiet luxury store with polished stone and soft reflections', depth: 'shallow retail depth' },
    street: { gradient: 'from-[#101318] via-[#1d2931] to-[#090909]', prompt: 'editorial city street with premium fashion lighting', depth: 'urban mid-depth' },
    office: { gradient: 'from-[#101116] via-[#20242a] to-[#0b0c0f]', prompt: 'modern office lobby with restrained architectural lines', depth: 'clean interior depth' },
    'coffee shop': { gradient: 'from-[#120f0c] via-[#2a211a] to-[#080808]', prompt: 'cinematic coffee shop corner with warm premium ambience', depth: 'soft interior depth' },
    beach: { gradient: 'from-[#071014] via-[#315467] to-[#d7ff55]', prompt: 'bright beach setting with polished resort styling', depth: 'open daylight depth' },
    airport: { gradient: 'from-[#0d1118] via-[#242a32] to-[#090909]', prompt: 'premium airport lounge with travel editorial framing', depth: 'wide lounge depth' },
    home: { gradient: 'from-[#100f12] via-[#24201f] to-[#080808]', prompt: 'minimal home interior with clean wardrobe mirror feel', depth: 'calm interior depth' },
    studio: { gradient: 'from-[#090909] via-[#181b20] to-[#0b0c0f]', prompt: 'seamless premium photography studio backdrop', depth: 'controlled studio depth' }
  }
  return { background, ...map[background] }
}
