import { analyzeWardrobeGaps } from './gapAnalyzer'
import { rankMarketplaceProducts } from './marketplace'
import { buildBudgetPlans } from './budgetPlanner'
import { buildPriceAlerts } from './priceTracker'
import { buildWishlist } from './wishlist'
import { analyzeTrends } from './trendAnalyzer'
import { buildPurchaseHistory } from './purchaseHistory'
import { compareProducts } from './comparisonEngine'
import type { ShoppingIntelligence, ShoppingWardrobeItem } from './types'
import { demoWardrobe, outfitPotential, strongestAndWeakestOccasion, wardrobeScore } from './wardrobeMath'

const recommendationCache = new Map<string, ShoppingIntelligence>()

export function buildShoppingRecommendations(input: ShoppingWardrobeItem[] = []): ShoppingIntelligence {
  const wardrobe = input.length ? input : demoWardrobe()
  const cacheKey = wardrobeSignature(wardrobe)
  const cached = recommendationCache.get(cacheKey)
  if (cached) return cached

  const gaps = analyzeWardrobeGaps(wardrobe)
  const products = rankMarketplaceProducts(gaps, wardrobe)
  const bestValue = products.filter((product) => product.inStock).slice(0, 6)
  const budgetPlans = buildBudgetPlans(products)
  const wishlist = buildWishlist(products)
  const priceAlerts = buildPriceAlerts(products)
  const trends = analyzeTrends(wardrobe)
  const purchaseHistory = buildPurchaseHistory(products)
  const comparison = compareProducts(products)
  const potential = outfitPotential(wardrobe)
  const occasions = strongestAndWeakestOccasion(wardrobe)

  const payload: ShoppingIntelligence = {
    wardrobe,
    wardrobeSummary: {
      itemCount: wardrobe.length,
      currentOutfitCombinations: potential.possibleOutfits,
      wardrobeScore: wardrobeScore(wardrobe),
      missingEssentials: gaps.filter((gap) => !gap.skipReason).length,
      strongestOccasion: occasions.strongest,
      weakestOccasion: occasions.weakest
    },
    gaps,
    products,
    bestValue,
    budgetPlans,
    wishlist,
    priceAlerts,
    trends,
    purchaseHistory,
    comparison,
    recentlyViewed: products.slice(3, 8),
    generatedAt: new Date().toISOString()
  }

  if (recommendationCache.size > 20) recommendationCache.clear()
  recommendationCache.set(cacheKey, payload)
  return payload
}

function wardrobeSignature(items: ShoppingWardrobeItem[]) {
  return items.map((item) => [
    item._id || item.id || item.image,
    item.category,
    item.primaryColor || item.color,
    item.style,
    item.season,
    item.wearCount || item.usageCount || 0
  ].join(':')).sort().join('|')
}

export type { ShoppingIntelligence } from './types'

