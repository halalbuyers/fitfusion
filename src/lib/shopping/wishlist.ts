import type { RankedProduct, WishlistItem } from './types'

export function buildWishlist(products: RankedProduct[]): WishlistItem[] {
  return products.slice(0, 3).map((product, index) => ({
    id: `wishlist-${product.id}`,
    product,
    status: index === 2 ? 'purchased' : 'saved',
    savedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
    purchasedAt: index === 2 ? new Date(Date.now() - 86400000).toISOString() : undefined
  }))
}

export function saveProduct(wishlist: WishlistItem[], product: RankedProduct) {
  if (wishlist.some((item) => item.product.id === product.id && item.status !== 'removed')) return wishlist
  return [
    {
      id: `wishlist-${product.id}`,
      product,
      status: 'saved',
      savedAt: new Date().toISOString()
    },
    ...wishlist
  ]
}

export function removeProduct(wishlist: WishlistItem[], productId: string) {
  return wishlist.map((item) => item.product.id === productId ? { ...item, status: 'removed' as const } : item)
}

export function markPurchased(wishlist: WishlistItem[], productId: string) {
  return wishlist.map((item) => item.product.id === productId
    ? { ...item, status: 'purchased' as const, purchasedAt: new Date().toISOString() }
    : item)
}

