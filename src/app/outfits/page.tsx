"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarPlus, CheckCircle2, Heart, Loader2, Send, Sparkles, Trash2, X } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Clothing = { _id: string; image: string; category: string }
type Outfit = {
  _id: string
  title: string
  occasion: string
  score: number
  explanation?: string
  colorAnalysis?: string
  tags?: string[]
  isFavorite?: boolean
  plannedFor?: string | null
  items: Array<{ clothing?: Clothing; role?: string }>
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [planDates, setPlanDates] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/outfits')
      .then((res) => res.json())
      .then((data) => {
        const next = Array.isArray(data) ? data : []
        setOutfits(next)
        setPlanDates(Object.fromEntries(next.map((outfit: Outfit) => [outfit._id, outfit.plannedFor?.slice(0, 10) || todayInputValue()])))
      })
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => ({
    saved: outfits.length,
    planned: outfits.filter((outfit) => outfit.plannedFor).length,
    favorites: outfits.filter((outfit) => outfit.isFavorite).length
  }), [outfits])

  async function patchOutfit(outfit: Outfit, body: Partial<Outfit>, message: string) {
    setBusyId(outfit._id)
    setError('')
    setNotice('')
    const previous = outfits
    setOutfits((current) => current.map((item) => item._id === outfit._id ? { ...item, ...body } : item))
    try {
      const res = await fetch(`/api/outfits/${outfit._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setNotice(message)
    } catch (e: any) {
      setOutfits(previous)
      setError(e.message || 'Update failed')
    } finally {
      setBusyId('')
    }
  }

  async function removeOutfit(outfit: Outfit) {
    setBusyId(outfit._id)
    setError('')
    setNotice('')
    const previous = outfits
    setOutfits((current) => current.filter((item) => item._id !== outfit._id))
    try {
      const res = await fetch(`/api/outfits/${outfit._id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Remove failed')
      setNotice('Outfit removed.')
    } catch (e: any) {
      setOutfits(previous)
      setError(e.message || 'Remove failed')
    } finally {
      setBusyId('')
    }
  }

  async function markWorn(outfit: Outfit) {
    setBusyId(outfit._id)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/outfits/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId: outfit._id, action: 'worn' })
      })
      if (!res.ok) throw new Error('Update failed')
      setNotice('Marked as worn. Future recommendations will learn from this.')
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setBusyId('')
    }
  }

  async function shareOutfit(outfit: Outfit) {
    setBusyId(outfit._id)
    setError('')
    setNotice('')
    try {
      const images = outfit.items.map((item) => item.clothing?.image).filter(Boolean)
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit: outfit._id,
          type: 'outfit',
          visibility: 'public',
          title: outfit.title,
          caption: outfit.explanation || outfit.title,
          images,
          hashtags: [outfit.occasion, ...(outfit.tags || [])].filter(Boolean),
          tags: [outfit.occasion, ...(outfit.tags || [])].filter(Boolean),
          occasion: outfit.occasion,
          style: outfit.tags?.[0] || '',
          season: ''
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Share failed')
      setNotice('Shared to community.')
    } catch (e: any) {
      setError(e.message || 'Share failed')
    } finally {
      setBusyId('')
    }
  }

  return (
    <AppFrame title="Saved outfits" eyebrow="Rotation, planning, sharing" action={<Link href="/outfit-generator" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black">Generate</Link>}>
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="glass rounded-[8px] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">{key}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      {error && <p className="mb-4 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      {notice && <p className="mb-4 rounded-[8px] border border-[#d7ff55]/25 bg-[#d7ff55]/10 p-3 text-sm text-[#efffbd]">{notice}</p>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-96 animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
      ) : outfits.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outfits.map((outfit) => (
            <article key={outfit._id} className="overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.04]">
              <div className="grid grid-cols-2 gap-px bg-white/10">
                {outfit.items.slice(0, 4).map((item, index) => item.clothing ? (
                  <div key={`${item.clothing._id}-${index}`} className="relative aspect-square bg-black/35">
                    <Image src={item.clothing.image} alt={item.clothing.category} fill sizes="180px" className="object-contain p-3" />
                  </div>
                ) : <div key={index} className="aspect-square bg-black/35" />)}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/35">{outfit.occasion}</p>
                    <h2 className="mt-2 font-semibold">{outfit.title}</h2>
                    {outfit.plannedFor && <p className="mt-1 text-xs text-[#d7ff55]">Planned {outfit.plannedFor.slice(0, 10)}</p>}
                  </div>
                  <span className="rounded-[8px] bg-white px-2.5 py-1 text-sm font-bold text-black">{outfit.score}</span>
                </div>
                <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-white/50">{outfit.explanation}</p>

                <div className="mt-4 grid gap-2">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={planDates[outfit._id] || todayInputValue()}
                      onChange={(e) => setPlanDates((current) => ({ ...current, [outfit._id]: e.target.value }))}
                      className="field h-10 flex-1 py-0 text-sm"
                    />
                    <button
                      title="Plan outfit"
                      onClick={() => patchOutfit(outfit, { plannedFor: planDates[outfit._id] || todayInputValue() }, 'Outfit planned.')}
                      disabled={busyId === outfit._id}
                      className="icon-button h-10 w-10"
                    >
                      {busyId === outfit._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button title="Favorite" onClick={() => patchOutfit(outfit, { isFavorite: !outfit.isFavorite }, outfit.isFavorite ? 'Removed favorite.' : 'Marked favorite.')} className="icon-button h-10 w-10">
                      <Heart className={`h-4 w-4 ${outfit.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button title="Mark worn" onClick={() => markWorn(outfit)} disabled={busyId === outfit._id} className="icon-button h-10 w-10">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button title="Share to community" onClick={() => shareOutfit(outfit)} disabled={busyId === outfit._id} className="icon-button h-10 w-10">
                      <Send className="h-4 w-4" />
                    </button>
                    {outfit.plannedFor && (
                      <button title="Remove from calendar" onClick={() => patchOutfit(outfit, { plannedFor: null }, 'Removed from calendar.')} className="icon-button h-10 w-10">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button title="Delete outfit" aria-label={`Delete ${outfit.title}`} onClick={() => removeOutfit(outfit)} disabled={busyId === outfit._id} className="icon-button ml-auto h-10 w-10 text-red-100 hover:bg-red-400/15">
                      {busyId === outfit._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-white/45" />
          <h2 className="mt-4 text-xl font-semibold">No saved outfits yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Generate a few local recommendations, save the best ones, and they will appear here for planning.</p>
          <Link href="/outfit-generator" className="mt-5 inline-flex rounded-[8px] bg-[#d7ff55] px-5 py-3 text-sm font-semibold text-black">Open generator</Link>
        </div>
      )}
    </AppFrame>
  )
}
