import Outfit from '../models/Outfit'
import OutfitInteraction, { type OutfitInteractionAction } from '../models/OutfitInteraction'
import UserPreference from '../models/UserPreference'
import { applyPersonalizationSignals, getPersonalizationProfile } from './personalization-engine'

export async function recordOutfitInteraction(input: { userId: string; outfitId?: string; outfitKey?: string; action: OutfitInteractionAction; outfit?: any }) {
  const outfit = input.outfit || (input.outfitId ? await Outfit.findOne({ _id: input.outfitId, userId: input.userId }).populate('items.clothing') : null)
  const outfitKey = input.outfitKey || outfit?.outfitKey
  await OutfitInteraction.create({ userId: input.userId, outfitId: input.outfitId, outfitKey, action: input.action })

  if (outfit) await applyPersonalizationSignals(input.userId, outfit, input.action)

  const profile = await getPersonalizationProfile(input.userId)
  const update: Record<string, unknown> = {
    preferredStyles: profile.favoriteStyles,
    preferredColors: profile.favoriteColors,
    avoidedColors: profile.dislikedColors,
    favoriteCategories: profile.favoriteCategories
  }
  if (input.action === 'rejected' && outfitKey) update.$addToSet = { rejectedOutfitKeys: outfitKey }
  if ((input.action === 'saved' || input.action === 'favorited') && outfitKey) update.$addToSet = { favoriteOutfitKeys: outfitKey }

  await UserPreference.findOneAndUpdate(
    { userId: input.userId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).catch(() => null)
}

export async function getUserLearningMemory(userId: string) {
  const interactions = await OutfitInteraction.find({ userId }).sort({ createdAt: -1 }).limit(80).lean().catch(() => [])
  return {
    recentOutfitKeys: interactions.map((item) => item.outfitKey).filter(Boolean).slice(0, 20) as string[],
    rejectedOutfitKeys: interactions.filter((item) => item.action === 'rejected').map((item) => item.outfitKey).filter(Boolean) as string[],
    savedOutfitKeys: interactions.filter((item) => ['saved', 'favorited', 'liked', 'worn'].includes(item.action)).map((item) => item.outfitKey).filter(Boolean) as string[]
  }
}
