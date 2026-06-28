import type { ColorMatchResult } from './colorEngine'
import type { WeatherMatchResult } from './weatherEngine'

export function explainStylistChoice(input: {
  occasion: string
  color: ColorMatchResult
  weather: WeatherMatchResult
  score: number
  layerScore: number
  diversityScore: number
}) {
  const parts = [
    input.color.explanation,
    input.weather.score >= 70 ? `the fabric and warmth suit ${input.weather.condition} weather` : `weather compatibility is the main limitation`,
    `it matches your selected ${input.occasion} occasion`
  ]
  if (input.layerScore >= 75) parts.push('the layering is clean and wearable')
  if (input.diversityScore >= 75) parts.push('it avoids repeating recent outfit patterns')
  return `This outfit works because ${parts.join(', ')}.`
}

