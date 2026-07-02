import type { AnalysisWardrobeItem } from '../analysis/types'

export type ShoppingWardrobeItem = AnalysisWardrobeItem & {
  name?: string
  formalityScore?: number
  warmthScore?: number
}

export type ShoppingOccasion = 'casual' | 'college' | 'office' | 'formal' | 'party' | 'wedding' | 'travel' | 'gym' | 'date' | 'streetwear'
export type ShoppingSeason = 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season'
export type WishlistStatus = 'saved' | 'purchased' | 'removed'
export type PriceAlertType = 'drop' | 'discount' | 'back-in-stock'

export type WardrobeEssential = {
  id: string
  title: string
  category: string
  color: string
  reason: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  seasonBoost: ShoppingSeason[]
  occasionBoost: ShoppingOccasion[]
  versatilityTags: string[]
  searchTags: string[]
  materialHints: string[]
  basePriceTarget: number
}

export type OutfitImpactScore = {
  newOutfitCombinations: number
  wardrobeScoreImprovement: number
  seasonalImprovement: number
  occasionImprovement: number
  versatility: number
  aiRecommendationScore: number
}

export type WardrobeMatch = {
  id: string
  label: string
  category: string
  color: string
  image?: string
  compatibility: number
  reason: string
}

export type GapRecommendation = WardrobeEssential & {
  impact: OutfitImpactScore
  ownedSimilarCount: number
  matchedWardrobe: WardrobeMatch[]
  explanation: string
  skipReason?: string
}

export type PricePoint = {
  date: string
  price: number
  discountPercent?: number
}

export type MarketplaceProduct = {
  id: string
  recommendationId: string
  title: string
  brand: string
  price: number
  originalPrice?: number
  rating: number
  availableColors: string[]
  sizes: string[]
  store: string
  image: string
  productLink: string
  material: string
  inStock: boolean
  priceHistory: PricePoint[]
  tags: string[]
}

export type RankedProduct = MarketplaceProduct & {
  gap: GapRecommendation
  matchedWardrobe: WardrobeMatch[]
  outfitImpact: OutfitImpactScore
  valueScore: number
  recommendationCopy: string
}

export type WishlistItem = {
  id: string
  product: RankedProduct
  status: WishlistStatus
  savedAt: string
  purchasedAt?: string
}

export type PriceAlert = {
  id: string
  productId: string
  type: PriceAlertType
  message: string
  previousPrice?: number
  currentPrice?: number
  discountPercent?: number
}

export type ShoppingPlan = {
  budget: number
  totalSpend: number
  newOutfits: number
  wardrobeScoreImprovement: number
  valueScore: number
  items: RankedProduct[]
  summary: string
}

export type TrendSignal = {
  id: string
  label: string
  type: 'color' | 'silhouette' | 'sneaker' | 'jacket'
  momentum: number
  fitWithWardrobe: number
  matchingOwnedItems: WardrobeMatch[]
  recommendation: string
}

export type PurchaseRecord = {
  id: string
  product: RankedProduct
  purchasedAt: string
  delivered: boolean
  addedToWardrobe: boolean
}

export type ProductComparison = {
  products: RankedProduct[]
  winnerId?: string
  rows: Array<{
    label: string
    values: Array<{ productId: string; value: string | number; tone?: 'good' | 'neutral' | 'warning' }>
  }>
}

export type ShoppingIntelligence = {
  wardrobe: ShoppingWardrobeItem[]
  wardrobeSummary: {
    itemCount: number
    currentOutfitCombinations: number
    wardrobeScore: number
    missingEssentials: number
    strongestOccasion: string
    weakestOccasion: string
  }
  gaps: GapRecommendation[]
  products: RankedProduct[]
  bestValue: RankedProduct[]
  budgetPlans: ShoppingPlan[]
  wishlist: WishlistItem[]
  priceAlerts: PriceAlert[]
  trends: TrendSignal[]
  purchaseHistory: PurchaseRecord[]
  comparison: ProductComparison
  recentlyViewed: RankedProduct[]
  generatedAt: string
}

