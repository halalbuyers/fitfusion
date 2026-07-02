"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, Bell, Check, CheckCircle2, ExternalLink, Gauge, Heart, Layers, Palette, RefreshCw, Shirt, ShoppingBag, Sparkles, Star, Timer, TrendingUp, X } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'
import { readApiJson } from '../../lib/api'
import { buildBudgetPlan } from '../../lib/shopping/budgetPlanner'
import { compareProducts } from '../../lib/shopping/comparisonEngine'
import type { GapRecommendation, ProductComparison, RankedProduct, ShoppingIntelligence, TrendSignal, WishlistItem } from '../../lib/shopping/types'

const budgetOptions = [2000, 5000, 10000]
const pageSize = 6

function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value)
}

function scoreTone(value: number) {
  if (value >= 84) return 'bg-[#d7ff55] text-black'
  if (value >= 70) return 'bg-white text-black'
  return 'bg-white/12 text-white'
}

function MetricTile({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Sparkles }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/48">{label}</p>
        <Icon className="h-4 w-4 text-[#d7ff55]" />
      </div>
      <p className="mt-3 text-2xl font-semibold sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/42">{note}</p>
    </div>
  )
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-white/35">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-[420px] animate-pulse rounded-[8px] bg-white/7" />
      ))}
    </div>
  )
}

function MatchList({ matches, limit = 5 }: { matches: RankedProduct['matchedWardrobe']; limit?: number }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">Matches with</p>
      <div className="mt-2 grid gap-1.5">
        {matches.slice(0, limit).map((match) => (
          <div key={match.id} className="flex items-center gap-2 text-sm text-white/62">
            <Check className="h-3.5 w-3.5 text-[#d7ff55]" />
            <span className="truncate">{match.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GapCard({ gap }: { gap: GapRecommendation }) {
  return (
    <article className="rounded-[8px] border border-white/10 bg-white/[0.045] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d7ff55]/35 hover:bg-white/[0.065]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#d7ff55]/70">{gap.priority} priority</p>
          <h3 className="mt-2 text-xl font-semibold">{gap.title}</h3>
        </div>
        <span className={`rounded-[8px] px-3 py-2 text-sm font-black ${scoreTone(gap.impact.aiRecommendationScore)}`}>
          {gap.impact.aiRecommendationScore}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/56">{gap.reason}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-[8px] bg-black/24 p-3">
          <p className="text-xs text-white/38">New outfits</p>
          <p className="mt-1 text-xl font-semibold text-[#d7ff55]">+{gap.impact.newOutfitCombinations.toLocaleString()}</p>
        </div>
        <div className="rounded-[8px] bg-black/24 p-3">
          <p className="text-xs text-white/38">Wardrobe score</p>
          <p className="mt-1 text-xl font-semibold">+{gap.impact.wardrobeScoreImprovement}%</p>
        </div>
        <div className="rounded-[8px] bg-black/24 p-3">
          <p className="text-xs text-white/38">Season lift</p>
          <p className="mt-1 text-xl font-semibold">+{gap.impact.seasonalImprovement}%</p>
        </div>
        <div className="rounded-[8px] bg-black/24 p-3">
          <p className="text-xs text-white/38">Occasion lift</p>
          <p className="mt-1 text-xl font-semibold">+{gap.impact.occasionImprovement}%</p>
        </div>
      </div>
      <p className="mt-4 rounded-[8px] border border-[#d7ff55]/20 bg-[#d7ff55]/10 p-3 text-sm leading-6 text-[#efffbd]">{gap.explanation}</p>
      {gap.skipReason ? <p className="mt-3 rounded-[8px] border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">{gap.skipReason}</p> : null}
      <MatchList matches={gap.matchedWardrobe} limit={5} />
    </article>
  )
}

function ProductCard({
  product,
  saved,
  purchased,
  compared,
  onSave,
  onRemove,
  onPurchase,
  onCompare
}: {
  product: RankedProduct
  saved: boolean
  purchased: boolean
  compared: boolean
  onSave: (product: RankedProduct) => void
  onRemove: (product: RankedProduct) => void
  onPurchase: (product: RankedProduct) => void
  onCompare: (product: RankedProduct) => void
}) {
  return (
    <article className="group overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.065]">
      <div className="relative aspect-[4/3] bg-black/34">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.035]"
        />
        <div className="absolute left-3 top-3 rounded-[8px] bg-black/70 px-2.5 py-1 text-xs backdrop-blur">{product.store}</div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-[8px] bg-white px-2.5 py-1 text-xs font-semibold text-black">
          <Star className="h-3.5 w-3.5 fill-black" />
          {product.rating}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-white/45">{product.brand}</p>
            <h3 className="mt-1 line-clamp-2 min-h-[3rem] text-lg font-semibold leading-6">{product.title}</h3>
          </div>
          <span className={`shrink-0 rounded-[8px] px-2.5 py-1.5 text-sm font-black ${scoreTone(product.valueScore)}`}>{product.valueScore}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <p className="text-2xl font-semibold">{formatInr(product.price)}</p>
          {product.originalPrice ? <p className="pb-1 text-sm text-white/35 line-through">{formatInr(product.originalPrice)}</p> : null}
          {!product.inStock ? <p className="pb-1 text-sm text-amber-100">Watch stock</p> : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[8px] bg-black/24 p-3">
            <p className="text-xs text-white/38">Outfits</p>
            <p className="mt-1 text-lg font-semibold text-[#d7ff55]">+{product.outfitImpact.newOutfitCombinations.toLocaleString()}</p>
          </div>
          <div className="rounded-[8px] bg-black/24 p-3">
            <p className="text-xs text-white/38">AI score</p>
            <p className="mt-1 text-lg font-semibold">{product.outfitImpact.aiRecommendationScore}</p>
          </div>
        </div>

        <p className="mt-4 min-h-[4.5rem] text-sm leading-6 text-white/55">{product.recommendationCopy}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {product.availableColors.slice(0, 4).map((color) => (
            <span key={color} className="rounded-[8px] bg-white/8 px-2 py-1 text-xs capitalize text-white/58">{color}</span>
          ))}
          <span className="rounded-[8px] bg-white/8 px-2 py-1 text-xs text-white/58">{product.sizes.slice(0, 3).join(', ')}</span>
        </div>

        <MatchList matches={product.matchedWardrobe} limit={4} />

        <div className="mt-5 grid grid-cols-4 gap-2">
          <button
            type="button"
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            onClick={() => saved ? onRemove(product) : onSave(product)}
            className={`flex h-10 items-center justify-center rounded-[8px] transition ${saved ? 'bg-[#d7ff55] text-black' : 'border border-white/10 bg-black/24 text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            {saved ? <X className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          </button>
          <button
            type="button"
            title={purchased ? 'Purchased' : 'Mark as purchased'}
            onClick={() => onPurchase(product)}
            className={`flex h-10 items-center justify-center rounded-[8px] transition ${purchased ? 'bg-white text-black' : 'border border-white/10 bg-black/24 text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={compared ? 'Remove from comparison' : 'Compare product'}
            onClick={() => onCompare(product)}
            className={`flex h-10 items-center justify-center rounded-[8px] transition ${compared ? 'bg-white text-black' : 'border border-white/10 bg-black/24 text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <a
            title="Open product"
            href={product.productLink}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center justify-center rounded-[8px] border border-white/10 bg-black/24 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  )
}

function BudgetMode({ data, budget, setBudget }: { data: ShoppingIntelligence; budget: number; setBudget: (value: number) => void }) {
  const plan = useMemo(() => buildBudgetPlan(data.products, budget), [budget, data.products])

  return (
    <section className="mt-10">
      <SectionHeader eyebrow="Budget mode" title="Best shopping list" action={
        <div className="flex flex-wrap gap-2">
          {budgetOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBudget(option)}
              className={`h-10 rounded-[8px] px-4 text-sm font-semibold transition ${budget === option ? 'bg-[#d7ff55] text-black' : 'border border-white/10 bg-white/6 text-white/65 hover:bg-white/10 hover:text-white'}`}
            >
              {formatInr(option)}
            </button>
          ))}
        </div>
      } />
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
          <label htmlFor="shopping-budget" className="text-xs uppercase tracking-[0.22em] text-white/35">Budget</label>
          <div className="mt-4 flex items-center gap-3">
            <input
              id="shopping-budget"
              type="range"
              min={1000}
              max={12000}
              step={500}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
              className="w-full accent-[#d7ff55]"
            />
            <input
              aria-label="Budget amount"
              type="number"
              min={1000}
              max={50000}
              step={500}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value || 0))}
              className="field h-11 w-28"
            />
          </div>
          <div className="mt-6 rounded-[8px] border border-[#d7ff55]/20 bg-[#d7ff55]/10 p-4">
            <p className="text-2xl font-semibold">{formatInr(plan.totalSpend || budget)}</p>
            <p className="mt-2 text-sm leading-6 text-[#efffbd]">
              {plan.items.length ? `Spend ${formatInr(plan.totalSpend)} to unlock ${plan.newOutfits.toLocaleString()} new outfit combinations.` : plan.summary}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[8px] bg-black/24 p-3">
              <p className="text-xs text-white/38">Score lift</p>
              <p className="mt-1 text-xl font-semibold">+{plan.wardrobeScoreImprovement}%</p>
            </div>
            <div className="rounded-[8px] bg-black/24 p-3">
              <p className="text-xs text-white/38">Value score</p>
              <p className="mt-1 text-xl font-semibold">{plan.valueScore}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plan.items.map((product, index) => (
            <PlanItem key={product.id} product={product} rank={index + 1} />
          ))}
          {!plan.items.length ? (
            <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-8 text-center text-white/52 md:col-span-2 xl:col-span-3">
              No high-impact item fits this budget yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function PlanItem({ product, rank }: { product: RankedProduct; rank: number }) {
  return (
    <article className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/35">Rank {rank}</p>
          <h3 className="mt-2 font-semibold">{product.title}</h3>
          <p className="mt-1 text-sm text-white/45">{product.brand} at {product.store}</p>
        </div>
        <span className="rounded-[8px] bg-white px-2.5 py-1 text-sm font-bold text-black">{product.valueScore}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-[8px] bg-black/24 p-3">
        <span className="text-sm text-white/45">{formatInr(product.price)}</span>
        <span className="text-sm font-semibold text-[#d7ff55]">+{product.outfitImpact.newOutfitCombinations.toLocaleString()} outfits</span>
      </div>
    </article>
  )
}

function TrendCard({ trend }: { trend: TrendSignal }) {
  return (
    <article className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4 transition duration-300 hover:border-white/25 hover:bg-white/[0.065]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">{trend.type}</p>
          <h3 className="mt-2 text-lg font-semibold">{trend.label}</h3>
        </div>
        <span className="rounded-[8px] bg-[#d7ff55] px-2.5 py-1 text-sm font-bold text-black">{trend.momentum}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/55">{trend.recommendation}</p>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-xs text-white/42">
          <span>Wardrobe fit</span>
          <span>{trend.fitWithWardrobe}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-[#d7ff55]" style={{ width: `${trend.fitWithWardrobe}%` }} />
        </div>
      </div>
      <MatchList matches={trend.matchingOwnedItems} limit={3} />
    </article>
  )
}

function WishlistPanel({
  items,
  productsById,
  onRemove,
  onPurchase
}: {
  items: WishlistItem[]
  productsById: Map<string, RankedProduct>
  onRemove: (product: RankedProduct) => void
  onPurchase: (product: RankedProduct) => void
}) {
  const visibleItems = items.filter((item) => item.status !== 'removed')
  return (
    <div className="grid gap-3">
      {visibleItems.map((item) => {
        const product = productsById.get(item.product.id) || item.product
        return (
          <div key={item.id} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{product.title}</h3>
                <p className="mt-1 text-sm text-white/45">{formatInr(product.price)} at {product.store}</p>
              </div>
              <span className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold ${item.status === 'purchased' ? 'bg-[#d7ff55] text-black' : 'bg-white/10 text-white/64'}`}>{item.status}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onPurchase(product)} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black">
                <CheckCircle2 className="h-4 w-4" />
                Purchased
              </button>
              <button type="button" onClick={() => onRemove(product)} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-black/24 text-sm text-white/68">
                <X className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        )
      })}
      {!visibleItems.length ? <p className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/50">No saved products yet.</p> : null}
    </div>
  )
}

function ComparisonTable({ comparison }: { comparison: ProductComparison }) {
  if (!comparison.products.length) {
    return <p className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/50">Choose products to compare.</p>
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-white/10">
      <table className="min-w-[640px] w-full border-collapse bg-white/[0.035] text-sm">
        <thead>
          <tr>
            <th className="w-40 border-b border-white/10 p-3 text-left text-white/40">Metric</th>
            {comparison.products.map((product) => (
              <th key={product.id} className="border-b border-white/10 p-3 text-left">
                <span className="block font-semibold">{product.title}</span>
                <span className="mt-1 block text-xs text-white/40">{product.brand}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => (
            <tr key={row.label}>
              <td className="border-t border-white/8 p-3 text-white/45">{row.label}</td>
              {row.values.map((value) => (
                <td key={`${row.label}-${value.productId}`} className={`border-t border-white/8 p-3 ${value.tone === 'good' ? 'text-[#d7ff55]' : value.tone === 'warning' ? 'text-amber-100' : 'text-white/70'}`}>
                  {value.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ShoppingClient() {
  const [data, setData] = useState<ShoppingIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [budget, setBudget] = useState(5000)
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const payload = await fetch('/api/shopping').then((res) => readApiJson<ShoppingIntelligence>(res, 'Could not load shopping recommendations'))
        if (!active) return
        setData(payload)
        setWishlistIds(new Set(payload.wishlist.filter((item) => item.status !== 'removed').map((item) => item.product.id)))
        setPurchasedIds(new Set(payload.wishlist.filter((item) => item.status === 'purchased').map((item) => item.product.id)))
        setCompareIds(payload.comparison.products.slice(0, 3).map((product) => product.id))
      } catch (loadError: any) {
        if (active) setError(loadError.message || 'Could not load shopping recommendations')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const productsById = useMemo(() => new Map((data?.products || []).map((product) => [product.id, product])), [data])
  const wishlist = useMemo<WishlistItem[]>(() => {
    if (!data) return []
    return [...wishlistIds]
      .filter((id) => !removedIds.has(id))
      .map((id) => productsById.get(id))
      .filter(Boolean)
      .map((product) => ({
        id: `wishlist-${product!.id}`,
        product: product!,
        status: purchasedIds.has(product!.id) ? 'purchased' as const : 'saved' as const,
        savedAt: new Date().toISOString(),
        purchasedAt: purchasedIds.has(product!.id) ? new Date().toISOString() : undefined
      }))
  }, [data, productsById, purchasedIds, removedIds, wishlistIds])

  const comparedProducts = useMemo(() => {
    if (!data) return []
    const selected = compareIds.map((id) => productsById.get(id)).filter(Boolean) as RankedProduct[]
    return selected.length ? selected : data.comparison.products
  }, [compareIds, data, productsById])
  const comparison = useMemo(() => compareProducts(comparedProducts), [comparedProducts])

  function saveProduct(product: RankedProduct) {
    setRemovedIds((current) => {
      const next = new Set(current)
      next.delete(product.id)
      return next
    })
    setWishlistIds((current) => new Set(current).add(product.id))
  }

  function removeProduct(product: RankedProduct) {
    setRemovedIds((current) => new Set(current).add(product.id))
    setWishlistIds((current) => {
      const next = new Set(current)
      next.delete(product.id)
      return next
    })
  }

  function markPurchased(product: RankedProduct) {
    saveProduct(product)
    setPurchasedIds((current) => new Set(current).add(product.id))
  }

  function toggleCompare(product: RankedProduct) {
    setCompareIds((current) => {
      if (current.includes(product.id)) return current.filter((id) => id !== product.id)
      return [product.id, ...current].slice(0, 3)
    })
  }

  const action = (
    <Link href="/wardrobe" className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-5 text-sm font-semibold text-black">
      <Shirt className="h-4 w-4" />
      Update wardrobe
    </Link>
  )

  if (loading) {
    return (
      <AppFrame title="Shopping intelligence" eyebrow="Wardrobe optimization marketplace" action={action}>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
        <div className="mt-8"><SkeletonGrid /></div>
      </AppFrame>
    )
  }

  if (error || !data) {
    return (
      <AppFrame title="Shopping intelligence" eyebrow="Wardrobe optimization marketplace" action={action}>
        <div className="rounded-[8px] border border-red-400/20 bg-red-400/10 p-5 text-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-semibold">Shopping recommendations unavailable</h2>
          </div>
          <p className="mt-2 text-sm leading-6">{error || 'Try again after refreshing your wardrobe.'}</p>
        </div>
      </AppFrame>
    )
  }

  const visibleProducts = data.products.slice(0, visibleCount)

  return (
    <AppFrame title="Shopping intelligence" eyebrow="Wardrobe optimization marketplace" action={action}>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile icon={Gauge} label="Wardrobe score" value={`${data.wardrobeSummary.wardrobeScore}/100`} note={`${data.wardrobeSummary.currentOutfitCombinations.toLocaleString()} current combinations`} />
        <MetricTile icon={Sparkles} label="Missing essentials" value={String(data.wardrobeSummary.missingEssentials)} note={`Weakest coverage: ${data.wardrobeSummary.weakestOccasion}`} />
        <MetricTile icon={ShoppingBag} label="Best purchase" value={data.products[0]?.gap.title || 'Ready'} note={data.products[0] ? `+${data.products[0].outfitImpact.newOutfitCombinations.toLocaleString()} outfits` : 'No gaps found'} />
        <MetricTile icon={Bell} label="Price alerts" value={String(data.priceAlerts.length)} note="Drops, discounts, and stock signals" />
      </div>

      <section className="mt-8">
        <SectionHeader eyebrow="AI recommended" title="Highest wardrobe value gaps" />
        <div className="grid gap-4 xl:grid-cols-3">
          {data.gaps.slice(0, 3).map((gap) => <GapCard key={gap.id} gap={gap} />)}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader eyebrow="Best value" title="Ranked products" action={
          <button
            type="button"
            onClick={() => setVisibleCount(pageSize)}
            className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/6 px-4 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Reset grid
          </button>
        } />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={wishlistIds.has(product.id) && !removedIds.has(product.id)}
              purchased={purchasedIds.has(product.id)}
              compared={compareIds.includes(product.id)}
              onSave={saveProduct}
              onRemove={removeProduct}
              onPurchase={markPurchased}
              onCompare={toggleCompare}
            />
          ))}
        </div>
        {visibleCount < data.products.length ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(data.products.length, count + pageSize))}
              className="rounded-[8px] bg-[#d7ff55] px-5 py-3 text-sm font-semibold text-black"
            >
              Load more products
            </button>
          </div>
        ) : null}
      </section>

      <BudgetMode data={data} budget={budget} setBudget={setBudget} />

      <section className="mt-10">
        <SectionHeader eyebrow="Trending" title="Trend fit with your closet" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.trends.map((trend) => <TrendCard key={trend.id} trend={trend} />)}
        </div>
      </section>

      <div className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section>
          <SectionHeader eyebrow="Wishlist" title="Saved and purchased" />
          <WishlistPanel items={wishlist} productsById={productsById} onRemove={removeProduct} onPurchase={markPurchased} />
        </section>

        <section>
          <SectionHeader eyebrow="Compare products" title="Price, material, impact" />
          <ComparisonTable comparison={comparison} />
        </section>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-3">
        <section>
          <SectionHeader eyebrow="Price drops" title="Tracking alerts" />
          <div className="grid gap-3">
            {data.priceAlerts.map((alert) => {
              const product = productsById.get(alert.productId)
              return (
                <div key={alert.id} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 h-4 w-4 text-[#d7ff55]" />
                    <div>
                      <p className="text-sm leading-6 text-white/68">{alert.message}</p>
                      {product ? <p className="mt-1 text-xs text-white/40">{product.brand} - {formatInr(product.price)}</p> : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Recently viewed" title="Continue comparing" />
          <div className="grid gap-3">
            {data.recentlyViewed.slice(0, 4).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => toggleCompare(product)}
                className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{product.title}</p>
                    <p className="mt-1 text-sm text-white/45">{formatInr(product.price)} - +{product.outfitImpact.newOutfitCombinations.toLocaleString()} outfits</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-white/45" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Purchase history" title="Delivery confirmation" />
          <div className="grid gap-3">
            {data.purchaseHistory.map((record) => (
              <div key={record.id} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{record.product.title}</p>
                    <p className="mt-1 text-sm text-white/45">{record.delivered ? 'Delivered' : 'In transit'}</p>
                  </div>
                  <span className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold ${record.addedToWardrobe ? 'bg-[#d7ff55] text-black' : 'bg-white/10 text-white/60'}`}>
                    {record.addedToWardrobe ? 'Added' : 'Confirm'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#d7ff55]" />
          <h2 className="text-xl font-semibold">AI shopping plan</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {data.budgetPlans.map((plan) => (
            <div key={plan.budget} className="rounded-[8px] bg-black/24 p-4">
              <p className="text-sm text-white/45">{formatInr(plan.budget)}</p>
              <p className="mt-2 text-lg font-semibold">{plan.items.length ? `Unlock ${plan.newOutfits.toLocaleString()} outfits` : 'Hold budget'}</p>
              <p className="mt-2 text-sm leading-6 text-white/50">{plan.items.map((item) => item.gap.title).join(', ') || plan.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#d7ff55]" />
          <h2 className="text-xl font-semibold">Wardrobe match intelligence</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[8px] bg-black/24 p-4">
            <Palette className="h-5 w-5 text-white/60" />
            <p className="mt-3 text-sm leading-6 text-white/55">{data.products[0]?.gap.title} complements {data.products[0]?.matchedWardrobe.length || 0} saved pieces.</p>
          </div>
          <div className="rounded-[8px] bg-black/24 p-4">
            <TrendingUp className="h-5 w-5 text-white/60" />
            <p className="mt-3 text-sm leading-6 text-white/55">Buying {data.gaps.find((gap) => gap.id.includes('chelsea'))?.title || 'black Chelsea boots'} improves formal and cold-weather coverage.</p>
          </div>
          <div className="rounded-[8px] bg-black/24 p-4">
            <Timer className="h-5 w-5 text-white/60" />
            <p className="mt-3 text-sm leading-6 text-white/55">{data.gaps.find((gap) => gap.skipReason)?.skipReason || 'No major duplicate purchase risks detected in the current basket.'}</p>
          </div>
        </div>
      </section>
    </AppFrame>
  )
}

