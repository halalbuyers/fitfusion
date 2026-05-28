import { analyzeClothing } from '../lib/fashion'
import { generateGeminiText, hasGemini } from './gemini'

export type ImageAnalysis = {
  category: string
  colors: string[]
  style: string
  season: string
  occasion?: string[]
  tags: string[]
  fitType?: string
  material?: string
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const fallback = () => {
    const analysis = analyzeClothing('')
    return {
      category: analysis.category,
      colors: analysis.colors,
      style: analysis.style,
      season: analysis.season,
      occasion: analysis.occasion,
      tags: analysis.tags,
      fitType: analysis.fitType,
      material: analysis.material
    }
  }

  if (!hasGemini()) {
    return fallback()
  }

  const system = `You are a fashion image analysis assistant. Given an image URL, return EXACTLY one JSON object (no commentary) with keys: category (one-word string: e.g., hoodie, shirt, pants), colors (array of dominant color names), style (single-word or short phrase), season (one of spring, summer, autumn, winter, all-season, or empty), occasion (array), fitType, material, tags (array of short tags). Respond only with valid JSON.`

  const user = `Image URL: ${imageUrl}\n\nReturn only JSON.`

  let raw = ''
  try {
    raw = await generateGeminiText(user, system)
  } catch {
    return fallback()
  }

  // Find first JSON object in the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      // Normalize fields
      const out: ImageAnalysis = {
        category: String(parsed.category || 'unknown'),
        colors: Array.isArray(parsed.colors) ? parsed.colors.map((c: any) => String(c).toLowerCase()) : [],
        style: String(parsed.style || ''),
        season: String(parsed.season || ''),
        occasion: Array.isArray(parsed.occasion) ? parsed.occasion.map((t: any) => String(t).toLowerCase()) : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t)) : [],
        fitType: String(parsed.fitType || ''),
        material: String(parsed.material || '')
      }
      return out
    } catch (e) {
      // fallthrough to fallback
    }
  }

  return fallback()
}

const openAiImageAnalysis = null
export default openAiImageAnalysis
