import Clothing from '../models/Clothing'
import { connectToDatabase } from '../lib/mongodb'
import { generateOutfits } from '../lib/fashion'
import { generateGeminiText, hasGemini } from './gemini'

export type GeneratedOutfit = {
  items: { id: string; role?: string }[]
  score: number
  explanation: string
  tags: string[]
  colorAnalysis?: string
  breakdown?: Record<string, number>
  method?: 'local' | 'hybrid'
}

function roleForCategory(category?: string) {
  const value = String(category || '').toLowerCase()
  if (['shirt', 't-shirt', 'hoodie'].includes(value)) return 'top'
  if (value === 'jacket') return 'layer'
  if (['pants', 'jeans', 'cargos', 'shorts'].includes(value)) return 'bottom'
  if (['shoes', 'sneakers'].includes(value)) return 'shoes'
  return 'accessory'
}

function buildLocalOutfits(items: any[], options: { occasion?: string; weather?: string; preferences?: string[] } = {}): GeneratedOutfit[] {
  return generateOutfits(items as any, {
    occasion: options.occasion,
    weather: options.weather,
    stylePreference: options.preferences?.[0]
  }).map((outfit) => ({
    items: outfit.items.map((item: any) => ({ id: String(item._id || item.id), role: roleForCategory(item.category) })),
    score: outfit.score,
    explanation: outfit.explanation,
    tags: outfit.tags,
    colorAnalysis: outfit.colorAnalysis,
    breakdown: outfit.breakdown,
    method: 'local'
  }))
}

async function buildHybridOutfits(items: any[], options: { occasion?: string; weather?: string; preferences?: string[] } = {}): Promise<GeneratedOutfit[]> {
  const localOutfits = buildLocalOutfits(items, options).slice(0, 6)
  if (!hasGemini()) return localOutfits

  const localCandidates = localOutfits
    .map((outfit, idx) => `#${idx} score=${outfit.score} items=${outfit.items.map((it) => it.id).join(', ')}`)
    .join('\n')

  const prompt = `You are improving outfit recommendations.
Context:
- occasion: ${options.occasion || 'any'}
- weather: ${options.weather || 'moderate'}
- preferences: ${(options.preferences || []).join(', ') || 'none'}

Candidate outfits from local algorithm:
${localCandidates}

Return ONLY valid JSON array with up to 4 outfits:
[
  { "candidateIndex": number, "score": 0-100, "explanation": string, "tags": [string] }
]`

  let raw = ''
  try {
    raw = await generateGeminiText(prompt, 'You are a fashion styling optimizer. Keep responses concise and practical.')
  } catch {
    return localOutfits
  }
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      const outfits: GeneratedOutfit[] = (Array.isArray(parsed) ? parsed : [])
        .map((o: any) => {
          const candidate = localOutfits[Number(o.candidateIndex)]
          if (!candidate) return null
          return {
            items: candidate.items,
            score: Math.max(0, Math.min(100, Number(o.score || candidate.score))),
            explanation: String(o.explanation || candidate.explanation),
            tags: Array.isArray(o.tags) ? o.tags.map((t: any) => String(t)) : candidate.tags,
            colorAnalysis: candidate.colorAnalysis,
            breakdown: candidate.breakdown,
            method: 'hybrid' as const
          }
        })
        .filter(Boolean) as GeneratedOutfit[]

      if (outfits.length) return outfits
    } catch (e) {
      console.error('Failed to parse outfits json', e)
    }
  }

  return localOutfits.slice(0, 4).map((outfit) => ({ ...outfit, method: 'hybrid' }))
}

export async function generateOutfitsForUser(
  userId: string,
  options: { occasion?: string; weather?: string; preferences?: string[]; mode?: 'basic' | 'hybrid' } = {}
): Promise<GeneratedOutfit[]> {
  try {
    await connectToDatabase()
  } catch {
    return []
  }
  const items = await Clothing.find({ userId }).lean()
  if (!items.length) return []

  if (options.mode === 'basic') return buildLocalOutfits(items, options).slice(0, 4)
  return buildHybridOutfits(items, options)
}

export default generateOutfitsForUser
