import type { RankedProduct, ShoppingPlan } from './types'

export const defaultBudgets = [2000, 5000, 10000]

export function buildBudgetPlan(products: RankedProduct[], budget: number): ShoppingPlan {
  const candidates = products
    .filter((product) => product.inStock && product.price <= budget)
    .sort((a, b) => productEfficiency(b) - productEfficiency(a))

  const selected: RankedProduct[] = []
  let spend = 0
  const usedRecommendations = new Set<string>()

  candidates.forEach((product) => {
    if (usedRecommendations.has(product.recommendationId)) return
    if (spend + product.price > budget) return
    selected.push(product)
    spend += product.price
    usedRecommendations.add(product.recommendationId)
  })

  if (!selected.length) {
    const fallback = products
      .filter((product) => product.inStock)
      .sort((a, b) => productEfficiency(b) - productEfficiency(a))[0]
    if (fallback && fallback.price <= budget) selected.push(fallback)
    spend = selected.reduce((sum, product) => sum + product.price, 0)
  }

  const newOutfits = selected.reduce((sum, product) => sum + product.outfitImpact.newOutfitCombinations, 0)
  const wardrobeScoreImprovement = selected.reduce((sum, product) => sum + product.outfitImpact.wardrobeScoreImprovement, 0)
  const valueScore = selected.length
    ? Math.round(selected.reduce((sum, product) => sum + product.valueScore, 0) / selected.length)
    : 0

  return {
    budget,
    totalSpend: spend,
    newOutfits,
    wardrobeScoreImprovement,
    valueScore,
    items: selected,
    summary: selected.length
      ? `Spend ${formatRupees(spend)} to unlock ${newOutfits.toLocaleString()} new outfit combinations.`
      : `No strong purchase fits inside ${formatRupees(budget)} right now. Save the budget for a higher-impact essential.`
  }
}

export function buildBudgetPlans(products: RankedProduct[], budgets = defaultBudgets) {
  return budgets.map((budget) => buildBudgetPlan(products, budget))
}

function productEfficiency(product: RankedProduct) {
  return (
    product.valueScore * 3 +
    product.outfitImpact.newOutfitCombinations / Math.max(1, product.price / 1000) +
    product.outfitImpact.aiRecommendationScore
  )
}

export function formatRupees(value: number) {
  return `Rs ${Math.round(value).toLocaleString('en-IN')}`
}

