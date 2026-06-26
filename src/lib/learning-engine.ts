import Outfit from '../models/Outfit'
import OutfitFeedback, { type OutfitFeedbackReaction } from '../models/OutfitFeedback'
import OutfitInteraction, { type OutfitInteractionAction } from '../models/OutfitInteraction'
import Clothing from '../models/Clothing'
import PersonalizationSignal, { type PreferenceType } from '../models/PersonalizationSignal'
import UserPreference from '../models/UserPreference'
import { applyPersonalizationSignals, getPersonalizationProfile } from './personalization-engine'

function normalize(value?: string) {
  return String(value || '').trim().toLowerCase()
}

function clean(values: unknown[]) {
  return [...new Set(values.map((value) => normalize(String(value || ''))).filter((value) => value && value !== 'unknown' && value !== 'other'))]
}

const reactionActionMap: Record<OutfitFeedbackReaction, OutfitInteractionAction> = {
  love_it: 'love_it',
  not_my_style: 'not_my_style',
  wear_again: 'wear_again',
  never_suggest_again: 'never_suggest_again'
}

const itemPreferenceDelta: Record<OutfitInteractionAction, number> = {
  liked: 2,
  saved: 4,
  favorited: 5,
  worn: 6,
  rejected: -5,
  love_it: 5,
  not_my_style: -4,
  wear_again: 8,
  never_suggest_again: -10
}

async function hydrateOutfitForLearning(outfit: any, userId: string) {
  if (!outfit?.items?.length) return outfit
  const entries = outfit.items || []
  const missingIds = entries
    .map((entry: any) => entry?.clothing || entry?.id)
    .filter((value: any) => value && typeof value !== 'object')
    .map((value: any) => String(value))

  if (!missingIds.length) return outfit

  const wardrobe = await Clothing.find({ userId, _id: { $in: missingIds } }).lean().catch(() => [])
  const byId = new Map(wardrobe.map((item: any) => [String(item._id), item]))
  return {
    ...outfit,
    items: entries.map((entry: any) => {
      const id = String(entry?.clothing || entry?.id || '')
      return {
        ...entry,
        clothing: typeof entry?.clothing === 'object' ? entry.clothing : byId.get(id)
      }
    })
  }
}

async function incrementSignal(userId: string, preferenceType: PreferenceType, value: string, delta: number) {
  const normalized = normalize(value)
  if (!normalized || normalized === 'unknown' || normalized === 'other') return
  await PersonalizationSignal.findOneAndUpdate(
    { userId, preferenceType, value: normalized },
    { $inc: { score: delta } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}

function upsertCorrection<T extends { count?: number; lastCorrectedAt?: Date }>(
  rows: T[],
  match: (row: T) => boolean,
  next: T
) {
  const hit = rows.find(match)
  if (hit) {
    hit.count = Number(hit.count || 0) + 1
    hit.lastCorrectedAt = new Date()
    return rows
  }
  return [...rows, next]
}

function outfitItems(outfit: any) {
  return (outfit?.items || []).map((entry: any) => entry?.clothing || entry).filter(Boolean)
}

function outfitItemIds(outfit: any) {
  return clean(outfitItems(outfit).map((item: any) => item._id || item.id))
}

function outfitFeedbackSignals(outfit: any) {
  const items = outfitItems(outfit)
  const styles = clean(items.map((item: any) => item.style))
  const seasons = clean(items.map((item: any) => item.season))
  return {
    colors: clean(items.flatMap((item: any) => [item.primaryColor || item.color, ...(item.colors || []), ...(item.secondaryColors || [])])),
    categories: clean(items.map((item: any) => item.category)),
    style: styles[0] || clean(outfit?.tags || [])[0] || '',
    season: seasons[0] || '',
    occasion: normalize(outfit?.occasion || 'casual')
  }
}

async function updateItemPreferenceScores(userId: string, outfit: any, action: OutfitInteractionAction) {
  const delta = itemPreferenceDelta[action] || 0
  if (!delta || !outfit) return
  const ids = outfitItemIds(outfit)
  if (!ids.length) return
  const update: Record<string, unknown> = { $inc: { itemPreferenceScore: delta } }
  if (['worn', 'wear_again'].includes(action)) {
    update.$inc = { itemPreferenceScore: delta, usageCount: 1, wearCount: 1 }
    update.$set = { lastWornAt: new Date() }
  }
  if (['liked', 'saved', 'favorited', 'love_it', 'wear_again'].includes(action)) {
    update.$set = { ...(update.$set as Record<string, unknown> | undefined), isFavorite: true, favorite: true }
  }
  await Clothing.updateMany({ userId, _id: { $in: ids } }, update).catch(() => null)
}

function preferenceSetUpdates(profile: Awaited<ReturnType<typeof getPersonalizationProfile>>) {
  return {
    favoriteColors: profile.favoriteColors,
    favoriteStyles: profile.favoriteStyles,
    favoriteCategories: profile.favoriteCategories,
    favoriteSeasons: profile.favoriteSeasons,
    preferredStyles: profile.favoriteStyles,
    preferredColors: profile.favoriteColors,
    avoidedColors: profile.dislikedColors,
    favoriteOccasions: profile.favoriteOccasions,
    dislikedColors: profile.dislikedColors,
    dislikedStyles: profile.dislikedStyles,
    dislikedCategories: profile.dislikedCategories,
    dislikedSeasons: profile.dislikedSeasons,
    dislikedOccasions: profile.dislikedOccasions
  }
}

async function syncUserPreferenceSummary(userId: string, action: OutfitInteractionAction, outfitKey?: string, outfit?: any) {
  const profile = await getPersonalizationProfile(userId)
  const setUpdate: Record<string, unknown> = preferenceSetUpdates(profile)
  const addToSet: Record<string, unknown> = {}
  const itemIds = outfit ? outfitItemIds(outfit) : []

  if (['rejected', 'not_my_style', 'never_suggest_again'].includes(action) && outfitKey) addToSet.rejectedOutfitKeys = outfitKey
  if (['liked', 'saved', 'favorited', 'worn', 'love_it', 'wear_again'].includes(action) && outfitKey) addToSet.likedOutfitKeys = outfitKey
  if (['saved', 'favorited', 'love_it', 'wear_again'].includes(action) && outfitKey) addToSet.favoriteOutfitKeys = outfitKey
  if (['liked', 'saved', 'favorited', 'worn', 'love_it', 'wear_again'].includes(action) && itemIds.length) addToSet.favoriteItems = { $each: itemIds }
  if (['rejected', 'not_my_style', 'never_suggest_again'].includes(action) && itemIds.length) addToSet.rejectedItems = { $each: itemIds }
  if (['worn', 'wear_again'].includes(action) && itemIds.length) addToSet.overusedItems = { $each: itemIds }

  await UserPreference.findOneAndUpdate(
    { userId },
    {
      $set: setUpdate,
      ...(Object.keys(addToSet).length ? { $addToSet: addToSet } : {})
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).catch(() => null)
}

export async function recordOutfitInteraction(input: { userId: string; outfitId?: string; outfitKey?: string; action: OutfitInteractionAction; outfit?: any }) {
  const rawOutfit = input.outfit || (input.outfitId ? await Outfit.findOne({ _id: input.outfitId, userId: input.userId }).populate('items.clothing') : null)
  const outfit = rawOutfit ? await hydrateOutfitForLearning(typeof rawOutfit.toObject === 'function' ? rawOutfit.toObject() : rawOutfit, input.userId) : null
  const outfitKey = input.outfitKey || outfit?.outfitKey
  await OutfitInteraction.create({ userId: input.userId, outfitId: input.outfitId, outfitKey, action: input.action })

  if (outfit) await applyPersonalizationSignals(input.userId, outfit, input.action)
  if (outfit) await updateItemPreferenceScores(input.userId, outfit, input.action)

  await syncUserPreferenceSummary(input.userId, input.action, outfitKey, outfit)
}

export async function recordOutfitFeedback(input: {
  userId: string
  outfitId?: string
  outfitKey?: string
  reaction: OutfitFeedbackReaction
  outfit?: any
}) {
  const action = reactionActionMap[input.reaction]
  const rawOutfit = input.outfit || (input.outfitId ? await Outfit.findOne({ _id: input.outfitId, userId: input.userId }).populate('items.clothing') : null)
  const outfit = rawOutfit ? await hydrateOutfitForLearning(typeof rawOutfit.toObject === 'function' ? rawOutfit.toObject() : rawOutfit, input.userId) : null
  const outfitKey = input.outfitKey || outfit?.outfitKey
  if (!outfitKey) throw new Error('Outfit key is required')
  const signals = outfitFeedbackSignals(outfit)

  await OutfitFeedback.create({
    userId: input.userId,
    outfitKey,
    reaction: input.reaction,
    colors: signals.colors,
    categories: signals.categories,
    style: signals.style,
    season: signals.season,
    occasion: signals.occasion
  })

  await OutfitInteraction.create({ userId: input.userId, outfitId: input.outfitId, outfitKey, action })
  if (outfit) {
    await applyPersonalizationSignals(input.userId, outfit, action)
    await updateItemPreferenceScores(input.userId, outfit, action)
  }
  await syncUserPreferenceSummary(input.userId, action, outfitKey, outfit)
}

export async function recordWardrobeCorrection(input: {
  userId: string
  predictedCategory?: string
  correctedCategory?: string
  predictedColor?: string
  correctedColor?: string
}) {
  const predictedCategory = normalize(input.predictedCategory)
  const correctedCategory = normalize(input.correctedCategory)
  const predictedColor = normalize(input.predictedColor)
  const correctedColor = normalize(input.correctedColor)
  const categoryChanged = predictedCategory && correctedCategory && predictedCategory !== correctedCategory
  const colorChanged = predictedColor && correctedColor && predictedColor !== correctedColor
  if (!categoryChanged && !colorChanged) return null

  const preference = await UserPreference.findOneAndUpdate(
    { userId: input.userId },
    { $setOnInsert: { userId: input.userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (categoryChanged) {
    preference.correctedCategories = upsertCorrection(
      [...(preference.correctedCategories || [])] as any[],
      (row: any) => row.predictedCategory === predictedCategory && row.correctedCategory === correctedCategory,
      { predictedCategory, correctedCategory, count: 1, lastCorrectedAt: new Date() } as any
    ) as any
    await Promise.all([
      incrementSignal(input.userId, 'category', predictedCategory, -2),
      incrementSignal(input.userId, 'category', correctedCategory, 3)
    ])
  }

  if (colorChanged) {
    preference.correctedColors = upsertCorrection(
      [...(preference.correctedColors || [])] as any[],
      (row: any) => row.predictedColor === predictedColor && row.correctedColor === correctedColor,
      { predictedColor, correctedColor, count: 1, lastCorrectedAt: new Date() } as any
    ) as any
    await Promise.all([
      incrementSignal(input.userId, 'color', predictedColor, -2),
      incrementSignal(input.userId, 'color', correctedColor, 3)
    ])
  }

  return preference.save()
}

export async function getUserLearningMemory(userId: string) {
  const interactions = await OutfitInteraction.find({ userId }).sort({ createdAt: -1 }).limit(80).lean().catch(() => [])
  return {
    recentOutfitKeys: interactions.map((item) => item.outfitKey).filter(Boolean).slice(0, 20) as string[],
    rejectedOutfitKeys: interactions.filter((item) => ['rejected', 'not_my_style', 'never_suggest_again'].includes(item.action)).map((item) => item.outfitKey).filter(Boolean) as string[],
    savedOutfitKeys: interactions.filter((item) => ['saved', 'favorited', 'liked', 'worn', 'love_it', 'wear_again'].includes(item.action)).map((item) => item.outfitKey).filter(Boolean) as string[]
  }
}
