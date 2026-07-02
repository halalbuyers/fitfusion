import type { GapRecommendation, MarketplaceProduct, RankedProduct, ShoppingWardrobeItem } from './types'
import { matchWardrobeForProduct } from './wardrobeMath'

export const marketplaceProducts: MarketplaceProduct[] = [
  {
    id: 'mk-white-sneaker-vega',
    recommendationId: 'white-sneakers',
    title: 'Court Minimal White Sneakers',
    brand: 'Vega Street',
    price: 2899,
    originalPrice: 3999,
    rating: 4.6,
    availableColors: ['white', 'black', 'cream'],
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
    store: 'Myntra',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.myntra.com/',
    material: 'Synthetic leather',
    inStock: true,
    priceHistory: [
      { date: '2026-06-01', price: 3499 },
      { date: '2026-06-20', price: 3199, discountPercent: 20 },
      { date: '2026-07-02', price: 2899, discountPercent: 28 }
    ],
    tags: ['white sneakers', 'minimal', 'daily']
  },
  {
    id: 'mk-white-sneaker-nova',
    recommendationId: 'white-sneakers',
    title: 'Leather Low Top Sneakers',
    brand: 'Nova Basics',
    price: 4599,
    rating: 4.8,
    availableColors: ['white', 'tan'],
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    store: 'Ajio',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.ajio.com/',
    material: 'Full grain leather',
    inStock: true,
    priceHistory: [
      { date: '2026-06-05', price: 4999 },
      { date: '2026-06-25', price: 4599 }
    ],
    tags: ['white sneakers', 'leather', 'premium']
  },
  {
    id: 'mk-black-loafer-metro',
    recommendationId: 'black-loafers',
    title: 'Black Penny Loafers',
    brand: 'Metro Mode',
    price: 3699,
    originalPrice: 4990,
    rating: 4.5,
    availableColors: ['black', 'brown'],
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
    store: 'Nykaa Fashion',
    image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.nykaafashion.com/',
    material: 'Leather upper',
    inStock: true,
    priceHistory: [
      { date: '2026-06-02', price: 4299 },
      { date: '2026-07-02', price: 3699, discountPercent: 26 }
    ],
    tags: ['black loafers', 'formal', 'office']
  },
  {
    id: 'mk-black-loafer-arlo',
    recommendationId: 'black-loafers',
    title: 'Soft Suede Driver Loafers',
    brand: 'Arlo Craft',
    price: 5299,
    rating: 4.7,
    availableColors: ['black', 'espresso', 'tan'],
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    store: 'Tata CLiQ',
    image: 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.tatacliq.com/',
    material: 'Suede leather',
    inStock: false,
    priceHistory: [
      { date: '2026-06-01', price: 5299 },
      { date: '2026-07-02', price: 5299 }
    ],
    tags: ['black loafers', 'suede', 'smart casual']
  },
  {
    id: 'mk-beige-chino-thread',
    recommendationId: 'beige-chinos',
    title: 'Slim Tapered Beige Chinos',
    brand: 'Threadline',
    price: 2199,
    originalPrice: 2999,
    rating: 4.4,
    availableColors: ['beige', 'navy', 'olive', 'black'],
    sizes: ['28', '30', '32', '34', '36'],
    store: 'Myntra',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.myntra.com/',
    material: 'Stretch cotton twill',
    inStock: true,
    priceHistory: [
      { date: '2026-06-01', price: 2799 },
      { date: '2026-06-18', price: 2399, discountPercent: 20 },
      { date: '2026-07-02', price: 2199, discountPercent: 27 }
    ],
    tags: ['beige chinos', 'office', 'smart casual']
  },
  {
    id: 'mk-beige-chino-urban',
    recommendationId: 'beige-chinos',
    title: 'Relaxed Cotton Khaki Trousers',
    brand: 'Urban Loom',
    price: 3299,
    rating: 4.6,
    availableColors: ['beige', 'cream', 'olive'],
    sizes: ['28', '30', '32', '34', '36', '38'],
    store: 'Ajio',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.ajio.com/',
    material: 'Cotton twill',
    inStock: true,
    priceHistory: [
      { date: '2026-06-10', price: 3299 },
      { date: '2026-07-02', price: 3299 }
    ],
    tags: ['khaki trousers', 'relaxed', 'trend']
  },
  {
    id: 'mk-navy-blazer-edit',
    recommendationId: 'navy-blazer',
    title: 'Unstructured Navy Blazer',
    brand: 'Edit Atelier',
    price: 5999,
    originalPrice: 7999,
    rating: 4.7,
    availableColors: ['navy', 'charcoal', 'brown'],
    sizes: ['S', 'M', 'L', 'XL'],
    store: 'Tata CLiQ',
    image: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.tatacliq.com/',
    material: 'Cotton-linen blend',
    inStock: true,
    priceHistory: [
      { date: '2026-06-03', price: 7499 },
      { date: '2026-07-02', price: 5999, discountPercent: 25 }
    ],
    tags: ['navy blazer', 'unstructured', 'formal']
  },
  {
    id: 'mk-white-oxford-civic',
    recommendationId: 'white-oxford-shirt',
    title: 'Classic White Oxford Shirt',
    brand: 'Civic Standard',
    price: 1899,
    originalPrice: 2499,
    rating: 4.5,
    availableColors: ['white', 'blue', 'pink'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    store: 'Myntra',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.myntra.com/',
    material: 'Cotton oxford',
    inStock: true,
    priceHistory: [
      { date: '2026-06-01', price: 2299 },
      { date: '2026-07-02', price: 1899, discountPercent: 24 }
    ],
    tags: ['white oxford shirt', 'formal', 'cotton']
  },
  {
    id: 'mk-chelsea-boot-north',
    recommendationId: 'black-chelsea-boots',
    title: 'Black Chelsea Boots',
    brand: 'North Yard',
    price: 4899,
    originalPrice: 5999,
    rating: 4.4,
    availableColors: ['black', 'brown'],
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    store: 'Ajio',
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.ajio.com/',
    material: 'Leather',
    inStock: true,
    priceHistory: [
      { date: '2026-06-08', price: 5499 },
      { date: '2026-07-02', price: 4899, discountPercent: 18 }
    ],
    tags: ['black chelsea boots', 'winter', 'formal']
  },
  {
    id: 'mk-beige-overshirt-loom',
    recommendationId: 'beige-overshirt',
    title: 'Beige Utility Overshirt',
    brand: 'Loom District',
    price: 2799,
    rating: 4.6,
    availableColors: ['beige', 'olive', 'black'],
    sizes: ['S', 'M', 'L', 'XL'],
    store: 'Nykaa Fashion',
    image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80',
    productLink: 'https://www.nykaafashion.com/',
    material: 'Cotton canvas',
    inStock: true,
    priceHistory: [
      { date: '2026-06-01', price: 2999 },
      { date: '2026-07-02', price: 2799 }
    ],
    tags: ['beige overshirt', 'utility', 'layer']
  }
]

export function rankMarketplaceProducts(gaps: GapRecommendation[], wardrobe: ShoppingWardrobeItem[]) {
  const gapById = new Map(gaps.map((gap) => [gap.id, gap]))
  return marketplaceProducts
    .map((product) => {
      const gap = gapById.get(product.recommendationId)
      if (!gap) return null
      const matchedWardrobe = matchWardrobeForProduct(wardrobe, { category: gap.category, color: gap.color, title: product.title }, 8)
      const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
      const affordability = Math.max(0, 100 - Math.round((product.price / Math.max(1, gap.basePriceTarget)) * 28))
      const valueScore = Math.round(
        gap.impact.aiRecommendationScore * 0.42 +
        gap.impact.versatility * 0.2 +
        product.rating * 8 +
        affordability * 0.18 +
        discount * 0.22 +
        (product.inStock ? 8 : -16)
      )
      return {
        ...product,
        gap,
        matchedWardrobe,
        outfitImpact: gap.impact,
        valueScore: Math.max(0, Math.min(100, valueScore)),
        recommendationCopy: recommendationCopy(product, gap, matchedWardrobe.length)
      } satisfies RankedProduct
    })
    .filter((product): product is RankedProduct => Boolean(product))
    .sort((a, b) => b.valueScore - a.valueScore)
}

export function paginateProducts<T>(products: T[], page = 1, pageSize = 8) {
  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safePageSize
  return {
    page: safePage,
    pageSize: safePageSize,
    total: products.length,
    totalPages: Math.max(1, Math.ceil(products.length / safePageSize)),
    items: products.slice(start, start + safePageSize)
  }
}

function recommendationCopy(product: MarketplaceProduct, gap: GapRecommendation, matchCount: number) {
  if (gap.ownedSimilarCount > 0) return `Skip unless replacing an older pair. You already own a similar ${gap.title.toLowerCase()}.`
  if (product.price <= gap.basePriceTarget && gap.impact.newOutfitCombinations > 100) {
    return `${product.title} is high value: it unlocks ${gap.impact.newOutfitCombinations} outfits while staying under the target price.`
  }
  return `${product.title} matches ${matchCount} wardrobe pieces and improves ${gap.occasionBoost.slice(0, 2).join(' and ')} coverage.`
}

