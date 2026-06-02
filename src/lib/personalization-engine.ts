import PersonalizationSignal, { type PreferenceType } from '../models/PersonalizationSignal'

const positiveWeight = { liked: 2, saved: 4, favorited: 5, worn: 6, rejected: -5 } as const

export type PersonalizationProfile = {
  favoriteColors: string[]
  favoriteStyles: string[]
  favoriteCategories: string[]
  favoriteOccasions: string[]
  dislikedColors: string[]
  dislikedStyles: string[]
}

function normalize(value?: string) {
  return String(value || '').trim().toLowerCase()
}

function clean(values: unknown[]) {
  return values.map((value) => normalize(String(value || ''))).filter((value): value is string => Boolean(value))
}

export function extractSignals(outfit: any) {
  const items = (outfit?.items || []).map((entry: any) => entry?.clothing || entry).filter(Boolean)
  return {
    color: [...new Set(clean(items.flatMap((item: any) => [item.primaryColor || item.color, ...(item.colors || [])])))],
    style: [...new Set(clean(items.map((item: any) => item.style)))],
    category: [...new Set(clean(items.map((item: any) => item.category)))],
    occasion: [normalize(outfit?.occasion)].filter(Boolean),
    structure: [[...new Set(items.map((item: any) => normalize(item.category)).filter(Boolean))].sort().join('+')].filter(Boolean)
  } satisfies Record<PreferenceType, string[]>
}

export async function applyPersonalizationSignals(userId: string, outfit: any, action: keyof typeof positiveWeight) {
  const delta = positiveWeight[action]
  const signals = extractSignals(outfit)
  const updates: Promise<unknown>[] = []
  for (const [preferenceType, values] of Object.entries(signals) as Array<[PreferenceType, string[]]>) {
    for (const value of values) {
      updates.push(PersonalizationSignal.findOneAndUpdate(
        { userId, preferenceType, value },
        { $inc: { score: delta } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ))
    }
  }
  await Promise.all(updates)
}

export async function getPersonalizationProfile(userId: string): Promise<PersonalizationProfile> {
  const rows = await PersonalizationSignal.find({ userId }).lean().catch(() => [])
  const top = (type: PreferenceType, min: number) => rows
    .filter((row) => row.preferenceType === type && Number(row.score) >= min)
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, 6)
    .map((row) => row.value)
  const bottom = (type: PreferenceType) => rows
    .filter((row) => row.preferenceType === type && Number(row.score) < 0)
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, 6)
    .map((row) => row.value)

  return {
    favoriteColors: top('color', 1),
    favoriteStyles: top('style', 1),
    favoriteCategories: top('category', 1),
    favoriteOccasions: top('occasion', 1),
    dislikedColors: bottom('color'),
    dislikedStyles: bottom('style')
  }
}
