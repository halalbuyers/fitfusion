"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Check, CloudSun, Heart, Loader2, RefreshCw, Save, Share2, Shirt, SlidersHorizontal, Sparkles, Thermometer, ThumbsDown, Wand2 } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Clothing = { _id: string; image: string; category: string; colors?: string[]; primaryColor?: string; style?: string; season?: string }
type Outfit = {
  title?: string
  occasion?: string
  items: Array<{ id: string; role?: string; clothing?: Clothing }>
  score: number
  explanation: string
  colorAnalysis?: string
  tags?: string[]
  breakdown?: Record<string, number>
  outfitKey?: string
  confidence?: number
  method?: string
}

type WeatherData = {
  temperature?: number
  condition?: string
  suggestion?: string
  source?: string
}

const occasions = ['casual', 'college', 'date', 'party', 'gym', 'formal', 'travel', 'winter', 'summer', 'monochrome', 'luxury', 'streetwear']
const weatherOptions = ['hot', 'warm', 'cool', 'cold', 'rainy']
const seasons = ['summer', 'winter', 'spring', 'autumn', 'all-season']
const MotionArticle = motion.article as any

function scoreTone(score: number) {
  if (score >= 82) return 'bg-[#d7ff55] text-black'
  if (score >= 68) return 'bg-white text-black'
  return 'bg-white/12 text-white'
}

function metricLabel(key: string) {
  return key.replace('Score', '').replace(/([A-Z])/g, ' $1').trim()
}

export default function OutfitGeneratorPage() {
  const [occasion, setOccasion] = useState('casual')
  const [weather, setWeather] = useState('warm')
  const [season, setSeason] = useState('all-season')
  const [temperature, setTemperature] = useState(24)
  const [mode, setMode] = useState<'basic' | 'hybrid'>('basic')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [wardrobe, setWardrobe] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [preferences, setPreferences] = useState<string[]>([])
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetch('/api/wardrobe').then((res) => res.json()).then((data) => {
      if (Array.isArray(data)) setWardrobe(data)
    }).catch(() => setWardrobe([]))

    fetch('/api/weather').then((res) => res.json()).then((data: WeatherData) => {
      setWeatherData(data)
      if (data?.condition) setWeather(data.condition)
      if (typeof data?.temperature === 'number') setTemperature(data.temperature)
    }).catch(() => undefined)

    fetch('/api/user/preferences').then((res) => res.json()).then((data) => {
      if (Array.isArray(data?.preferredStyles)) setPreferences(data.preferredStyles)
    }).catch(() => undefined)
  }, [])

  const wardrobeById = useMemo(() => new Map(wardrobe.map((item) => [item._id, item])), [wardrobe])
  const wardrobeCounts = useMemo(() => {
    const count = (terms: string[]) => wardrobe.filter((item) => terms.some((term) => item.category?.toLowerCase().includes(term))).length
    return {
      tops: count(['tshirt', 't-shirt', 't shirt', 'tee', 'shirt', 'hoodie']),
      bottoms: count(['jeans', 'cargo', 'shorts', 'pants', 'trouser']),
      shoes: count(['sneaker', 'shoe', 'boot']),
      layers: count(['jacket', 'coat', 'blazer', 'puffer'])
    }
  }, [wardrobe])
  const ready = wardrobeCounts.tops > 0 && wardrobeCounts.bottoms > 0 && wardrobeCounts.shoes > 0

  async function generate() {
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const res = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion, weather, temperature, season, mode, preferences, limit: 8 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not generate outfits')
      setOutfits(data.outfits || [])
      if (!data.outfits?.length) {
        setError(ready
          ? 'No comfortable outfit passed the weather rules. Try a milder season or add lighter pieces.'
          : 'Add at least one top, one bottom, and one pair of shoes before generating.')
      }
    } catch (e: any) {
      setError(e.message || 'Could not generate outfits')
    } finally {
      setLoading(false)
    }
  }

  async function saveOutfit(outfit: Outfit, index: number) {
    setSaving(String(index))
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/saved-outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit: { ...outfit, title: outfit.title || `${occasion} fit ${index + 1}` } })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setNotice('Outfit saved.')
    } catch (e: any) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  async function rememberOutfit(outfit: Outfit, action: 'favorite' | 'reject') {
    if (!outfit.outfitKey) return
    setNotice('')
    await fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'favorite'
        ? { favoriteOutfitKey: outfit.outfitKey }
        : { rejectOutfitKey: outfit.outfitKey })
    }).catch(() => undefined)

    if (action === 'reject') {
      setOutfits((current) => current.filter((item) => item.outfitKey !== outfit.outfitKey))
      setNotice('Rejected outfit removed.')
    } else {
      setNotice('Preference saved.')
    }
  }

  async function shareOutfit(outfit: Outfit, index: number) {
    const text = `${outfit.title || `${occasion} fit ${index + 1}`} - ${outfit.score}% style match. ${outfit.explanation}`
    if (navigator.share) {
      await navigator.share({ title: 'FitFusion outfit', text }).catch(() => undefined)
      return
    }
    await navigator.clipboard?.writeText(text).catch(() => undefined)
    setNotice('Outfit copied for sharing.')
  }

  return (
    <AppFrame title="Outfit generator" eyebrow="Weather-aware styling engine">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-[8px] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#d7ff55]" />
              <h2 className="font-semibold">Controls</h2>
            </div>
            <span className={`rounded-[8px] px-3 py-1 text-xs font-semibold ${ready ? 'bg-[#d7ff55] text-black' : 'bg-red-400/15 text-red-100'}`}>
              {ready ? 'Ready' : 'Needs wardrobe'}
            </span>
          </div>

          <div className="mt-5 grid gap-5">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-white/35">Occasion</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {occasions.map((item) => (
                  <button key={item} onClick={() => setOccasion(item)} className={`h-10 rounded-[8px] px-3 text-sm capitalize transition ${occasion === item ? 'bg-white text-black' : 'bg-white/8 text-white/64 hover:bg-white/14 hover:text-white'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-white/35">Weather</p>
                <div className="grid grid-cols-5 gap-2">
                  {weatherOptions.map((item) => (
                    <button key={item} title={item} onClick={() => setWeather(item)} className={`flex h-10 items-center justify-center rounded-[8px] text-sm capitalize transition ${weather === item ? 'bg-[#d7ff55] text-black' : 'bg-white/8 text-white/64 hover:bg-white/14 hover:text-white'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-white/35">Season</p>
                <select value={season} onChange={(e) => setSeason(e.target.value)} className="field h-10 py-0 capitalize">
                  {seasons.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_160px_150px]">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/35">
                  <Thermometer className="h-4 w-4" />
                  Temperature
                </span>
                <input value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} min={0} max={45} type="range" className="w-full accent-[#d7ff55]" />
              </label>
              <input value={temperature} onChange={(e) => setTemperature(Number(e.target.value || 0))} type="number" min={0} max={45} className="field h-11" />
              <select value={mode} onChange={(e) => setMode(e.target.value as 'basic' | 'hybrid')} className="field h-11">
                <option value="basic">Local</option>
                <option value="hybrid">Hybrid AI</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={generate} disabled={loading || !ready} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-5 text-sm font-semibold text-black transition hover:bg-[#e8ff91] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {loading ? 'Generating' : 'Generate outfits'}
              </button>
              <button onClick={generate} disabled={loading || !ready} className="flex h-11 items-center justify-center gap-2 rounded-[8px] border border-white/10 px-4 text-sm text-white/70 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50">
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          </div>
        </div>

        <aside className="glass rounded-[8px] p-5">
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-[#d7ff55]" />
            <h2 className="font-semibold">Context</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[8px] bg-black/25 p-3">
              <p className="text-white/38">Weather</p>
              <p className="mt-1 font-semibold capitalize">{weather}</p>
            </div>
            <div className="rounded-[8px] bg-black/25 p-3">
              <p className="text-white/38">Temp</p>
              <p className="mt-1 font-semibold">{temperature}C</p>
            </div>
            <div className="rounded-[8px] bg-black/25 p-3">
              <p className="text-white/38">Season</p>
              <p className="mt-1 font-semibold capitalize">{season}</p>
            </div>
            <div className="rounded-[8px] bg-black/25 p-3">
              <p className="text-white/38">Source</p>
              <p className="mt-1 font-semibold capitalize">{weatherData?.source || 'manual'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/52">{weatherData?.suggestion || 'The engine filters outfits by warmth, layer count, season, and category conflicts before ranking style.'}</p>
          <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs text-white/48">
            {Object.entries(wardrobeCounts).map(([key, value]) => (
              <div key={key} className="rounded-[8px] bg-white/7 p-2">
                <p className="text-lg font-semibold text-white">{value}</p>
                <p className="capitalize">{key}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 flex items-start gap-2 rounded-[8px] border border-[#d7ff55]/25 bg-[#d7ff55]/10 p-3 text-sm text-[#efffbd]">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}

      <section className="mt-6">
        {loading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[360px] animate-pulse rounded-[8px] bg-white/7" />)}
          </div>
        ) : outfits.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {outfits.map((outfit, index) => {
              const visualItems = outfit.items.map((item) => item.clothing || wardrobeById.get(item.id)).filter(Boolean) as Clothing[]
              return (
                <MotionArticle
                  key={outfit.outfitKey || `${outfit.score}-${index}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045]"
                >
                  <div className="grid grid-cols-4 gap-px bg-white/10">
                    {visualItems.slice(0, 4).map((item) => (
                      <div key={item._id} className="relative aspect-square bg-black/45">
                        <Image src={item.image} alt={item.category} fill sizes="160px" className="object-contain p-3" />
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - visualItems.slice(0, 4).length) }).map((_, slot) => (
                      <div key={`empty-${slot}`} className="flex aspect-square items-center justify-center bg-black/35 text-white/20">
                        <Shirt className="h-6 w-6" />
                      </div>
                    ))}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.22em] text-white/35">{outfit.method || 'local'}</p>
                        <h2 className="mt-2 text-xl font-semibold capitalize">{outfit.title || `${occasion} fit ${index + 1}`}</h2>
                      </div>
                      <div className="grid shrink-0 gap-1 text-right">
                        <span className={`rounded-[8px] px-3 py-2 text-lg font-black ${scoreTone(outfit.score)}`}>{outfit.score}</span>
                        <span className="text-[11px] text-white/38">{outfit.confidence ?? 0}% confidence</span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-white/58">{outfit.explanation}</p>
                    {outfit.colorAnalysis && <p className="mt-2 text-xs text-white/38">{outfit.colorAnalysis}</p>}

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {['Top', 'Bottom', 'Shoes', 'Layer', 'Accessories'].map((role) => {
                        const match = outfit.items.find((item) => item.role?.toLowerCase().includes(role.toLowerCase()))
                        const clothing = match?.clothing || (match?.id ? wardrobeById.get(match.id) : undefined)
                        return (
                          <div key={role} className="min-h-[68px] rounded-[8px] border border-white/8 bg-black/22 p-2">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{role}</p>
                            <p className="mt-2 line-clamp-2 text-xs capitalize text-white/72">{clothing?.category || 'Optional'}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {[...new Set((outfit.tags || []).filter(Boolean).map(String))].slice(0, 7).map((tag, tagIndex) => <span key={`${outfit.outfitKey || index}-tag-${tag}-${tagIndex}`} className="rounded-[8px] bg-white/8 px-2.5 py-1 text-xs capitalize text-white/58">{tag}</span>)}
                      <span className="rounded-[8px] bg-[#d7ff55]/10 px-2.5 py-1 text-xs capitalize text-[#e8ff91]">{weather} weather fit</span>
                      <span className="rounded-[8px] bg-white/8 px-2.5 py-1 text-xs capitalize text-white/58">{outfit.occasion || occasion}</span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-white/50">
                      {Object.entries(outfit.breakdown || {}).slice(0, 6).map(([key, value]) => (
                        <div key={key} className="rounded-[8px] bg-black/25 p-2">
                          <div className="capitalize">{metricLabel(key)}</div>
                          <div className="mt-1 font-semibold text-white">{Math.round(Number(value))}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-[1fr_repeat(4,40px)]">
                      <button onClick={() => saveOutfit(outfit, index)} disabled={saving === String(index)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60">
                        {saving === String(index) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </button>
                      <button title="Favorite signal" onClick={() => rememberOutfit(outfit, 'favorite')} className="icon-button h-10 w-10">
                        <Heart className="h-4 w-4" />
                      </button>
                      <button title="Regenerate outfits" onClick={generate} disabled={loading} className="icon-button h-10 w-10 disabled:opacity-50">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button title="Share outfit" onClick={() => shareOutfit(outfit, index)} className="icon-button h-10 w-10">
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button title="Reject outfit" onClick={() => rememberOutfit(outfit, 'reject')} className="icon-button h-10 w-10">
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </MotionArticle>
              )
            })}
          </div>
        ) : (
          <div className="glass rounded-[8px] p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[#d7ff55]" />
            <h2 className="mt-4 text-xl font-semibold">{ready ? 'Ready to generate' : 'Build a complete base first'}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/50">
              {ready ? 'Choose the weather, season, and occasion, then generate a ranked set of wearable outfits.' : 'The generator needs at least one top, bottom, and pair of shoes to create complete outfits.'}
            </p>
            {!ready && (
              <Link href="/wardrobe" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-white px-5 text-sm font-semibold text-black">
                Add wardrobe items
              </Link>
            )}
          </div>
        )}
      </section>
    </AppFrame>
  )
}
