import type { PurchaseRecord, RankedProduct, ShoppingWardrobeItem } from './types'

export function buildPurchaseHistory(products: RankedProduct[]): PurchaseRecord[] {
  return products.slice(2, 4).map((product, index) => ({
    id: `purchase-${product.id}`,
    product,
    purchasedAt: new Date(Date.now() - (index + 4) * 86400000).toISOString(),
    delivered: index === 0,
    addedToWardrobe: index === 0
  }))
}

export function purchasedToWardrobeItem(record: PurchaseRecord): ShoppingWardrobeItem | null {
  if (!record.delivered || !record.addedToWardrobe) return null
  return {
    id: `purchased-${record.product.id}`,
    category: record.product.gap.category,
    primaryColor: record.product.gap.color,
    color: record.product.gap.color,
    colors: [record.product.gap.color],
    brand: record.product.brand,
    material: record.product.material,
    season: 'all-season',
    occasion: record.product.gap.occasionBoost,
    tags: record.product.tags,
    createdAt: record.purchasedAt
  }
}

