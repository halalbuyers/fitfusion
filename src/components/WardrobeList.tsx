"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Edit3, Heart, Search, SlidersHorizontal, Trash2, Undo2 } from 'lucide-react'
import ClothingCard from './ClothingCard'
import EditClothingModal from './EditClothingModal'
import { useUser } from '@clerk/nextjs'
import { displayReviewValue, reviewCategories } from '../lib/review-options'

type Clothing = {
  _id: string
  image: string
  category: string
  primaryColor?: string
  secondaryColors?: string[]
  colors: string[]
  style?: string
  season?: string
  fit?: string
  formalityScore?: number
  warmthScore?: number
  brand?: string
  tags?: string[]
  occasion?: string[]
  fitType?: string
  material?: string
  isFavorite?: boolean
}

const categories = ['all', 'unknown', ...reviewCategories]

export default function WardrobeList({ refreshKey }: { refreshKey?: number }) {
  const { user } = useUser()
  const [items, setItems] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [toast, setToast] = useState<{ message: string; id?: string } | null>(null)
  const pendingRef = useRef<Record<string, number>>({})
  const lastDeletedRef = useRef<Record<string, any>>({})

  const fetchItems = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (category !== 'all') params.set('category', category)
      const res = await fetch(`/api/wardrobe?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch wardrobe')
      setItems(await res.json())
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }, [category, query, user])

  useEffect(() => { fetchItems() }, [fetchItems, refreshKey])

  const stats = useMemo(() => {
    const favoriteCount = items.filter((item) => item.isFavorite).length
    const styles = new Set(items.map((item) => item.style).filter(Boolean))
    const avgFormality = Math.round(items.reduce((sum, item) => sum + Number(item.formalityScore || 45), 0) / Math.max(1, items.length))
    return { favoriteCount, styles: styles.size, avgFormality }
  }, [items])

  async function toggleFavorite(item: Clothing) {
    setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, isFavorite: !entry.isFavorite } : entry))
    await fetch(`/api/wardrobe/${item._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: !item.isFavorite })
    }).catch(() => fetchItems())
  }

  function removeItem(item: Clothing) {
    const id = item._id
    setItems((curr) => curr.filter((c) => c._id !== id))
    lastDeletedRef.current[id] = item
    setToast({ message: 'Item removed', id })
    pendingRef.current[id] = window.setTimeout(async () => {
      await fetch(`/api/wardrobe/${id}`, { method: 'DELETE' }).catch(() => undefined)
      delete pendingRef.current[id]
    }, 5000)
  }

  if (!user) return <div className="p-6 text-center text-white/45">Sign in to view your wardrobe.</div>

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-2 gap-2 text-xs text-white/50 sm:flex">
          <span className="rounded-[8px] bg-white/7 px-3 py-2">{items.length} pieces</span>
          <span className="rounded-[8px] bg-white/7 px-3 py-2">{stats.favoriteCount} favorites</span>
          <span className="rounded-[8px] bg-white/7 px-3 py-2">{stats.styles} styles</span>
          <span className="rounded-[8px] bg-white/7 px-3 py-2">{stats.avgFormality} formality</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search closet" className="field h-10 pl-9" />
          </div>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="field h-10 pl-9 capitalize">
              {categories.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
      ) : error ? (
        <div className="rounded-[8px] border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-100">{error}</div>
      ) : !items.length ? (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-8 text-center text-white/45">No matching pieces yet.</div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 xl:columns-4">
          {items.map((it) => (
            <div key={it._id} className="relative mb-4 break-inside-avoid">
              <ClothingCard image={it.image} title={it.category} category={it.style || it.category} colors={it.colors?.length ? it.colors : [it.primaryColor || 'unknown'].filter((color) => color !== 'unknown')} isFavorite={it.isFavorite} />
              <div className="absolute right-2 top-2 flex gap-1">
                <button title={it.isFavorite ? 'Remove favorite' : 'Favorite'} onClick={() => toggleFavorite(it)} className="icon-button h-9 w-9">
                  <Heart className={`h-4 w-4 ${it.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => setEditing(it)} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/7 text-xs font-medium text-white/75 transition hover:bg-white/12 hover:text-white">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button onClick={() => removeItem(it)} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-red-300/15 bg-red-400/10 text-xs font-medium text-red-100 transition hover:bg-red-400/18">
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...new Set([it.season, it.fit, ...(it.tags || []).slice(0, 2)].filter(Boolean).map(String))].map((tag) => (
                  <span key={`${it._id}-${tag}`} className="rounded-[8px] bg-white/7 px-2 py-1 text-[11px] text-white/45">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditClothingModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems((curr) => curr.map((c) => (c._id === updated._id ? updated : c)))
            setEditing(null)
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-20 left-4 z-50 rounded-[8px] border border-white/10 bg-black/85 p-3 text-sm shadow-2xl backdrop-blur-xl lg:bottom-4">
          <div className="flex items-center gap-3">
            <span>{toast.message}</span>
            <button
              title="Undo"
              onClick={() => {
                const id = toast.id
                if (!id) return
                const timeoutId = pendingRef.current[id]
                if (timeoutId) clearTimeout(timeoutId)
                const restored = lastDeletedRef.current[id]
                if (restored) setItems((curr) => [restored, ...curr])
                delete pendingRef.current[id]
                delete lastDeletedRef.current[id]
                setToast(null)
              }}
              className="icon-button"
            >
              <Undo2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
