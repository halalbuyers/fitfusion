import { findSimilarItems } from '../similarity-engine'

export function detectVisionDuplicates(item: any, wardrobe: any[]) {
  return findSimilarItems(item, wardrobe, Math.min(5, wardrobe.length))
    .filter((entry) => entry.score >= 78)
    .map((entry) => ({
      id: String(entry.item._id || entry.item.id || ''),
      score: entry.score,
      reason: entry.reason,
      category: entry.item.category,
      primaryColor: entry.item.primaryColor || entry.item.color,
      image: entry.item.image
    }))
}

