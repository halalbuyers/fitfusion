import { isLuxuryPalette, normalizeColors } from './color-engine'
import { normalizeCategory, normalizeStyle } from './fashion-analysis'
import type { GeneratedOutfit, WardrobeEngineItem } from './outfit-engine'
import { analyzeWeather, type WeatherContext } from './weather-engine'

function itemColors(item: WardrobeEngineItem) {
  return normalizeColors([item.primaryColor || item.color, ...(item.secondaryColors || []), ...(item.colors || [])])
}

function readableList(values: string[]) {
  const unique = [...new Set(values.filter(Boolean))]
  if (unique.length <= 1) return unique[0] || 'balanced'
  return `${unique.slice(0, -1).join(', ')} and ${unique[unique.length - 1]}`
}

export function explainOutfitLocally(outfit: Pick<GeneratedOutfit, 'items' | 'occasion' | 'score' | 'breakdown'>, weather: WeatherContext = {}) {
  const colors = [...new Set(outfit.items.flatMap(itemColors))]
  const styles = [...new Set(outfit.items.map((item) => normalizeStyle(item.style)))]
  const categories = outfit.items.map((item) => normalizeCategory(item.category))
  const weatherTip = analyzeWeather(weather).tip
  const palette = colors.length <= 2 ? `${readableList(colors)} palette` : `${colors.slice(0, 3).join(', ')} palette`
  const style = readableList(styles)
  const layer = categories.includes('jacket') || categories.includes('hoodie')
    ? 'Layering adds structure and keeps the outfit practical.'
    : 'The silhouette stays clean and easy to wear.'
  const luxury = isLuxuryPalette(colors) ? ' The neutral luxury palette gives it a more polished finish.' : ''

  return `This ${outfit.occasion} outfit works because the ${palette} supports a coherent ${style} direction. ${layer} ${weatherTip}${luxury} Overall confidence comes from the local score of ${outfit.score}/100.`
}

