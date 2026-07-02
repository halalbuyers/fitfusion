import type { ProductComparison, RankedProduct } from './types'

export function compareProducts(products: RankedProduct[], limit = 3): ProductComparison {
  const compared = products.slice(0, limit)
  const winner = [...compared].sort((a, b) => b.valueScore - a.valueScore)[0]
  return {
    products: compared,
    winnerId: winner?.id,
    rows: [
      {
        label: 'Price',
        values: compared.map((product) => ({
          productId: product.id,
          value: `Rs ${product.price.toLocaleString('en-IN')}`,
          tone: product.price === Math.min(...compared.map((entry) => entry.price)) ? 'good' : 'neutral'
        }))
      },
      {
        label: 'Versatility',
        values: compared.map((product) => ({ productId: product.id, value: product.outfitImpact.versatility, tone: product.outfitImpact.versatility >= 80 ? 'good' : 'neutral' }))
      },
      {
        label: 'Outfit impact',
        values: compared.map((product) => ({ productId: product.id, value: `+${product.outfitImpact.newOutfitCombinations}`, tone: product.outfitImpact.newOutfitCombinations >= 100 ? 'good' : 'neutral' }))
      },
      {
        label: 'Material',
        values: compared.map((product) => ({ productId: product.id, value: product.material, tone: product.material.toLowerCase().includes('leather') || product.material.toLowerCase().includes('cotton') ? 'good' : 'neutral' }))
      },
      {
        label: 'AI score',
        values: compared.map((product) => ({ productId: product.id, value: product.outfitImpact.aiRecommendationScore, tone: product.id === winner?.id ? 'good' : 'neutral' }))
      }
    ]
  }
}

