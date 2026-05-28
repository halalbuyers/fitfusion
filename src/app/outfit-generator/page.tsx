"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Heart, Loader2, RefreshCw, Save, Sparkles, Wand2 } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Clothing = { _id: string; image: string; category: string; colors?: string[]; style?: string }
type Outfit = {
  title?: string
  occasion?: string
  items: Array<{ id: string; role?: string; clothing?: Clothing }>
  score: number
  explanation: string
  colorAnalysis?: string
  tags?: string[]
  breakdown?: Record<string, number>
  method?: string
}

const occasions = ['casual', 'college', 'party', 'formal', 'gym', 'travel', 'date night']

export default function OutfitGeneratorPage() {
  const [occasion, setOccasion] = useState('casual')
  const [weather, setWeather] = useState('moderate')
  const [mode, setMode] = useState<'basic' | 'hybrid'>('basic')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [wardrobe, setWardrobe] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/wardrobe').then((res) => res.json()).then((data) => {
      if (Array.isArray(data)) setWardrobe(data)
    }).catch(() => setWardrobe([]))
    fetch('/api/weather').then((res) => res.json()).then((data) => {
      if (data?.condition) setWeather(data.condition)
    }).catch(() => undefined)
  }, [])

  const wardrobeById = useMemo(() => new Map(wardrobe.map((item) => [item._id, item])), [wardrobe])

  async function generate() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion, weather, mode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not generate outfits')
      setOutfits(data.outfits || [])
      if (!data.outfits?.length) setError('Add a top, bottom, and shoes first. The local engine needs a base outfit.')
    } catch (e: any) {
      setError(e.message || 'Could not generate outfits')
    } finally {
      setLoading(false)
    }
  }

  async function saveOutfit(outfit: Outfit, index: number) {
    setSaving(String(index))
    try {
      const res = await fetch('/api/saved-outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit: { ...outfit, title: outfit.title || `${occasion} fit ${index + 1}` } })
      })
      if (!res.ok) throw new Error('Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <AppFrame title="Outfit generator" eyebrow="Local styling engine">
      <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {occasions.map((item) => (
              <button key={item} onClick={() => setOccasion(item)} className={`rounded-[8px] px-3 py-2 text-sm capitalize transition ${occasion === item ? 'bg-white text-black' : 'bg-white/8 text-white/62 hover:bg-white/14'}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="weather" className="field h-11 sm:w-40" />
            <select value={mode} onChange={(e) => setMode(e.target.value as 'basic' | 'hybrid')} className="field h-11 sm:w-36">
              <option value="basic">Local</option>
              <option value="hybrid">Hybrid AI</option>
            </select>
            <button onClick={generate} disabled={loading} className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-5 text-sm font-semibold text-black transition hover:bg-[#e8ff91] disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? 'Generating' : 'Generate'}
            </button>
          </div>
        </div>
      </section>

      {error && <p className="mt-4 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}

      <section className="mt-6 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#d7ff55]" />
            <h2 className="font-semibold">Engine status</h2>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-white/55">
            <div className="flex justify-between rounded-[8px] bg-white/7 px-3 py-2"><span>Wardrobe pieces</span><span>{wardrobe.length}</span></div>
            <div className="flex justify-between rounded-[8px] bg-white/7 px-3 py-2"><span>Mode</span><span>{mode}</span></div>
            <div className="flex justify-between rounded-[8px] bg-white/7 px-3 py-2"><span>Weather</span><span>{weather}</span></div>
          </div>
          <button onClick={generate} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[8px] border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:bg-white/8">
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        </aside>

        <div className="grid gap-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[8px] bg-white/7" />)
          ) : outfits.length ? (
            outfits.map((outfit, index) => {
              const visualItems = outfit.items.map((item) => item.clothing || wardrobeById.get(item.id)).filter(Boolean) as Clothing[]
              return (
                <article key={`${outfit.score}-${index}`} className="overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.04]">
                  <div className="grid gap-0 sm:grid-cols-[0.9fr_1.1fr]">
                    <div className="grid grid-cols-2 gap-px bg-white/10">
                      {visualItems.slice(0, 4).map((item) => (
                        <div key={item._id} className="relative aspect-square bg-black/45">
                          <Image src={item.image} alt={item.category} fill sizes="180px" className="object-contain p-3" />
                        </div>
                      ))}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-white/35">{outfit.method || 'local'}</p>
                          <h2 className="mt-2 text-2xl font-semibold capitalize">{outfit.title || `${occasion} fit ${index + 1}`}</h2>
                        </div>
                        <span className="rounded-[8px] bg-white px-3 py-2 text-lg font-black text-black">{outfit.score}</span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-white/55">{outfit.explanation}</p>
                      {outfit.colorAnalysis && <p className="mt-2 text-xs text-white/38">{outfit.colorAnalysis}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(outfit.tags || []).slice(0, 5).map((tag) => <span key={tag} className="rounded-[8px] bg-white/8 px-2.5 py-1 text-xs text-white/55">{tag}</span>)}
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-white/50">
                        {Object.entries(outfit.breakdown || {}).slice(0, 6).map(([key, value]) => (
                          <div key={key} className="rounded-[8px] bg-black/25 p-2">
                            <div className="capitalize">{key}</div>
                            <div className="mt-1 font-semibold text-white">{value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button onClick={() => saveOutfit(outfit, index)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black">
                          {saving === String(index) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save
                        </button>
                        <button className="icon-button h-10 w-10">
                          <Heart className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })
          ) : (
            <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-10 text-center text-white/45">
              Generate combinations when your closet has at least one top, bottom, and shoe.
            </div>
          )}
        </div>
      </section>
    </AppFrame>
  )
}
