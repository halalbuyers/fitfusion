import type { PriceAlert, RankedProduct } from './types'

export function buildPriceAlerts(products: RankedProduct[]): PriceAlert[] {
  return products.flatMap((product) => {
    const alerts: PriceAlert[] = []
    const history = [...product.priceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const previous = history[history.length - 2]
    const current = history[history.length - 1]

    if (previous && current && current.price < previous.price) {
      const drop = previous.price - current.price
      alerts.push({
        id: `${product.id}-drop`,
        productId: product.id,
        type: 'drop',
        previousPrice: previous.price,
        currentPrice: current.price,
        discountPercent: Math.round((drop / previous.price) * 100),
        message: `${product.title} dropped by Rs ${drop.toLocaleString('en-IN')} at ${product.store}.`
      })
    }

    if (product.originalPrice && product.originalPrice > product.price) {
      const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      if (discountPercent >= 15) {
        alerts.push({
          id: `${product.id}-discount`,
          productId: product.id,
          type: 'discount',
          previousPrice: product.originalPrice,
          currentPrice: product.price,
          discountPercent,
          message: `${discountPercent}% discount is live on ${product.title}.`
        })
      }
    }

    if (product.inStock && product.id.includes('arlo')) {
      alerts.push({
        id: `${product.id}-stock`,
        productId: product.id,
        type: 'back-in-stock',
        currentPrice: product.price,
        message: `${product.title} is available again in core sizes.`
      })
    }

    return alerts
  }).slice(0, 8)
}

export function lowestTrackedPrice(product: RankedProduct) {
  return Math.min(...product.priceHistory.map((entry) => entry.price), product.price)
}

