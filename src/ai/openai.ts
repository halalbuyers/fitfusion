import { analyzeClothingText, mergeFashionAnalysis } from '../lib/fashion-analysis'
import { generateGeminiImageText, hasGemini } from './gemini'

export type ImageAnalysis = {
  category: string
  primaryColor?: string
  secondaryColors?: string[]
  colors: string[]
  style: string
  season: string
  occasion?: string[]
  tags: string[]
  fit?: string
  fitType?: string
  formalityScore?: number
  warmthScore?: number
  material?: string
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const fallback = () => {
    const analysis = analyzeClothingText('')
    return {
      category: analysis.category,
      primaryColor: analysis.primaryColor,
      secondaryColors: analysis.secondaryColors,
      colors: analysis.colors,
      style: analysis.style,
      season: analysis.season,
      occasion: analysis.occasion,
      tags: analysis.tags,
      fit: analysis.fit,
      fitType: analysis.fitType,
      formalityScore: analysis.formalityScore,
      warmthScore: analysis.warmthScore,
      material: analysis.material
    }
  }

  if (!hasGemini()) return fallback()

  const system = `You are a fashion image analysis assistant. Analyze only the visible clothing item, not the background or model. Return EXACTLY one JSON object with keys: category (one of tshirt, shirt, hoodie, jacket, jeans, cargo, shorts, sneakers, boots, accessories), primaryColor, secondaryColors, colors, style (one of streetwear, minimal, formal, casual, techwear, old-money, vintage, sporty, y2k), season (spring, summer, autumn, winter, all-season), occasion, fit, fitType, material, formalityScore, warmthScore, tags. Use ordinary color names. Respond only with valid JSON.`
  const user = `Analyze this clothing image for a wardrobe recommendation engine. Return only JSON.`

  let raw = ''
  try {
    raw = await generateGeminiImageText(imageUrl, user, system)
  } catch {
    return fallback()
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return fallback()

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const base = analyzeClothingText('')
    return mergeFashionAnalysis(base, {
      category: String(parsed.category || ''),
      primaryColor: String(parsed.primaryColor || ''),
      secondaryColors: Array.isArray(parsed.secondaryColors) ? parsed.secondaryColors.map((c: any) => String(c).toLowerCase()) : [],
      colors: Array.isArray(parsed.colors) ? parsed.colors.map((c: any) => String(c).toLowerCase()) : [],
      style: String(parsed.style || ''),
      season: String(parsed.season || ''),
      occasion: Array.isArray(parsed.occasion) ? parsed.occasion.map((t: any) => String(t).toLowerCase()) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t)) : [],
      fit: String(parsed.fit || parsed.fitType || ''),
      fitType: String(parsed.fitType || parsed.fit || ''),
      formalityScore: Number(parsed.formalityScore),
      warmthScore: Number(parsed.warmthScore),
      material: String(parsed.material || '')
    })
  } catch {
    return fallback()
  }
}

const openAiImageAnalysis = null
export default openAiImageAnalysis
