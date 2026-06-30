export const photoStudioThemes = ['magazine cover', 'luxury fashion', 'instagram reel cover', 'street fashion', 'studio portrait', 'lookbook', 'travel', 'night city'] as const

export function normalizePhotoTheme(value?: string) {
  const text = String(value || '').toLowerCase()
  return photoStudioThemes.find((theme) => text.includes(theme)) || 'lookbook'
}

export function buildPhotoStudioPlan(input: { theme?: string; background: string; lighting: string; outfitTitle?: string }) {
  const theme = normalizePhotoTheme(input.theme)
  return {
    theme,
    status: 'queued',
    prompt: `Premium ${theme} editorial image for ${input.outfitTitle || 'wardrobe outfit'} in a ${input.background} scene with ${input.lighting} lighting. Preserve avatar identity, body proportions, garment colors, and outfit structure.`,
    productionNotes: [
      'Preserve face, body, and pose from the avatar.',
      'Use wardrobe items as the clothing source of truth.',
      'Keep fabric scale and shoe proportions realistic.'
    ]
  }
}
