import crypto from 'crypto'
import { normalizeBackground, backgroundTreatment } from './backgroundGenerator'
import type { BodyAnalysis, BodyBox } from './bodyAnalyzer'
import { lightingTreatment, normalizeLighting } from './lightingEngine'
import { buildPhotoStudioPlan } from './photoStudio'
import { normalizePose, poseAdjustment } from './poseGenerator'
import { buildTryOnSuggestions, scoreTryOnLook } from './styleScore'

export const styleVariations = ['minimal', 'streetwear', 'luxury', 'old money', 'techwear', 'korean', 'business casual', 'monochrome', 'summer', 'winter'] as const

function normalizeStyleVariation(value?: string) {
  const text = String(value || '').toLowerCase()
  return styleVariations.find((style) => text.includes(style)) || 'minimal'
}

function itemRole(item: any) {
  const role = String(item?.role || '').toLowerCase()
  const category = String(item?.clothing?.category || item?.category || '').toLowerCase()
  if (role.includes('top') || /(tshirt|t-shirt|tee|shirt|hoodie|blouse|dress|kurti|saree)/.test(category)) return 'top'
  if (role.includes('layer') || /(jacket|blazer|coat|hoodie)/.test(category)) return 'layer'
  if (role.includes('bottom') || /(jeans|cargo|shorts|pant|trouser|skirt)/.test(category)) return 'bottom'
  if (role.includes('shoe') || /(shoe|sneaker|boot|heel|loafer|sandal)/.test(category)) return 'shoes'
  return 'accessories'
}

function expandBox(box: BodyBox, amount: number): BodyBox {
  return {
    x: Math.max(0, box.x - amount),
    y: Math.max(0, box.y - amount),
    width: Math.min(100, box.width + amount * 2),
    height: Math.min(100, box.height + amount * 2)
  }
}

export function buildRenderSettings(input: any = {}) {
  const pose = normalizePose(input.pose)
  const background = normalizeBackground(input.background)
  const lighting = normalizeLighting(input.lighting)
  return {
    styleVariation: normalizeStyleVariation(input.styleVariation),
    pose,
    background,
    lighting,
    occasion: String(input.occasion || 'casual').toLowerCase(),
    weather: String(input.weather || 'warm').toLowerCase(),
    photoTheme: input.photoTheme ? String(input.photoTheme).toLowerCase() : '',
    appliedSuggestion: String(input.appliedSuggestion || '')
  }
}

export function renderCacheKey(input: { userId: string; avatarId: string; outfitKey?: string; settings: any }) {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify({ userId: input.userId, avatarId: input.avatarId, outfitKey: input.outfitKey, settings: input.settings }))
    .digest('hex')
}

export function buildLayerPlan(input: { outfit: any; clothingById: Map<string, any>; body: BodyAnalysis; settings: any }) {
  const pose = poseAdjustment(input.settings.pose)
  const zones = input.body.renderZones
  const zoneForRole: Record<string, BodyBox> = {
    top: zones.top,
    layer: expandBox(zones.layer, 1.5),
    bottom: zones.bottom,
    shoes: zones.shoes,
    accessories: zones.accessories
  }
  const items = (input.outfit?.items || []).map((entry: any) => {
    const clothing = entry.clothing || input.clothingById.get(String(entry.id || entry.clothing?._id || '')) || entry
    return { ...entry, clothing, role: itemRole({ ...entry, clothing }) }
  })

  return items
    .filter((entry: any) => entry.clothing?.image)
    .map((entry: any, index: number) => {
      const role = itemRole(entry)
      const zone = zoneForRole[role] || zones.accessories
      return {
        id: String(entry.clothing._id || entry.id || `${role}-${index}`),
        role,
        category: entry.clothing.category,
        image: entry.clothing.image,
        color: entry.clothing.primaryColor || entry.clothing.color,
        x: zone.x,
        y: zone.y,
        width: Math.max(10, zone.width * (role === 'shoes' ? pose.stanceScale : 1)),
        height: zone.height,
        opacity: role === 'layer' ? 0.92 : 0.96,
        zIndex: role === 'layer' ? 4 : role === 'accessories' ? 5 : role === 'shoes' ? 3 : 2,
        transform: `rotate(${pose.tilt}deg)`
      }
    })
}

export function buildTryOnRender(input: { userId: string; avatar: any; outfit: any; clothingById: Map<string, any>; settings: any }) {
  const settings = buildRenderSettings(input.settings)
  const layerPlan = buildLayerPlan({ outfit: input.outfit, clothingById: input.clothingById, body: input.avatar.bodyAnalysis, settings })
  const scores = scoreTryOnLook({ outfit: input.outfit, settings, bodyConfidence: input.avatar.bodyAnalysis?.confidence })
  const suggestions = buildTryOnSuggestions({ outfit: input.outfit, scores, settings })
  const background = backgroundTreatment(settings.background)
  const lighting = lightingTreatment(settings.lighting)
  const cacheKey = renderCacheKey({
    userId: input.userId,
    avatarId: String(input.avatar._id),
    outfitKey: input.outfit.outfitKey,
    settings
  })
  const photoStudio = settings.photoTheme ? buildPhotoStudioPlan({
    theme: settings.photoTheme,
    background: background.background,
    lighting: lighting.lighting,
    outfitTitle: input.outfit.title
  }) : undefined

  return {
    cacheKey,
    title: input.outfit.title || `${settings.styleVariation} try-on`,
    occasion: input.outfit.occasion || settings.occasion,
    outfitKey: input.outfit.outfitKey,
    outfitSnapshot: input.outfit,
    settings: { ...settings, backgroundTreatment: background, lightingTreatment: lighting, poseTreatment: poseAdjustment(settings.pose) },
    originalImageUrl: input.avatar.imageUrl,
    previewUrl: input.avatar.imageUrl,
    layerPlan,
    scores,
    suggestions,
    photoStudio,
    status: 'complete' as const
  }
}
