import Clothing from '../models/Clothing'
import UserPreference from '../models/UserPreference'
import { connectToDatabase } from '../lib/mongodb'
import { buildPreferenceProfile } from '../lib/preference-engine'
import { generateOutfits, outfitKey, type OutfitRequest } from '../lib/outfit-engine'
import { generateGeminiText, hasGemini } from './gemini'

export type GeneratedOutfit = {
  items: { id: string; role?: string }[]
  score: number
  explanation: string
  tags: string[]
  colorAnalysis?: string
  breakdown?: Record<string, number>
  outfitKey?: string
  method?: 'local' | 'hybrid'
}

function roleForCategory(category?: string) {
  const value = String(category || '').toLowerCase()
  if (['shirt', 'tshirt', 't-shirt', 'hoodie'].includes(value)) return 'top'
  if (value === 'jacket') return 'layer'
  if (['jeans', 'cargo', 'cargos', 'shorts', 'pants'].includes(value)) return 'bottom'
  if (['boots', 'shoes', 'sneakers'].includes(value)) return 'shoes'
  return 'accessory'
}

function toApiOutfits(items: any[], request: OutfitRequest): GeneratedOutfit[] {
  return generateOutfits(items, request).map((outfit) => ({
    items: outfit.items.map((item: any) => ({ id: String(item._id || item.id), role: roleForCategory(item.category) })),
    score: outfit.score,
    explanation: outfit.explanation,
    tags: outfit.tags,
    colorAnalysis: outfit.colorAnalysis,
    breakdown: outfit.breakdown,
    outfitKey: outfit.outfitKey || outfitKey(outfit.items),
    method: 'local'
  }))
}

async function explainWithAi(outfits: GeneratedOutfit[], options: { occasion?: string; weather?: string; preferences?: string[] }) {
  if (!hasGemini() || !outfits.length) return outfits

  const candidates = outfits.slice(0, 5).map((outfit, idx) => ({
    candidateIndex: idx,
    score: outfit.score,
    tags: outfit.tags,
    colorAnalysis: outfit.colorAnalysis
  }))

  const prompt = `Rewrite explanations for these already-ranked outfit candidates. Do not change items or invent new outfits.
Context: occasion=${options.occasion || 'casual'}, weather=${options.weather || 'moderate'}, preferences=${(options.preferences || []).join(', ') || 'none'}
Candidates JSON: ${JSON.stringify(candidates)}
Return ONLY JSON: [{"candidateIndex":0,"explanation":"...","tags":["..."]}]`

  try {
    const raw = await generateGeminiText(prompt, 'You are a concise AI stylist. Explain why a scored outfit works; never generate new combinations.')
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return outfits
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return outfits
    const copy = [...outfits]
    for (const entry of parsed) {
      const candidate = copy[Number(entry.candidateIndex)]
      if (!candidate) continue
      candidate.explanation = String(entry.explanation || candidate.explanation)
      candidate.tags = Array.isArray(entry.tags) ? entry.tags.map(String) : candidate.tags
      candidate.method = 'hybrid'
    }
    return copy
  } catch {
    return outfits
  }
}

export async function generateOutfitsForUser(
  userId: string,
  options: { occasion?: string; weather?: string; temperature?: number; preferences?: string[]; mode?: 'basic' | 'hybrid'; limit?: number } = {}
): Promise<GeneratedOutfit[]> {
  try {
    await connectToDatabase()
  } catch {
    return []
  }

  const [items, storedPreferences] = await Promise.all([
    Clothing.find({ userId }).lean(),
    UserPreference.findOne({ userId }).lean().catch(() => null)
  ])
  if (!items.length) return []

  const profile = buildPreferenceProfile(items as any, storedPreferences || undefined)
  const request: OutfitRequest = {
    occasion: options.occasion || 'casual',
    weather: options.weather,
    temperature: options.temperature,
    stylePreference: options.preferences?.[0] || profile.preferredStyles[0],
    preferences: profile,
    limit: options.limit || 12
  }

  const localOutfits = toApiOutfits(items as any[], request)
  if (options.mode === 'hybrid') return explainWithAi(localOutfits, options)
  return localOutfits
}

export default generateOutfitsForUser

