"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bell, CloudSun, Heart, MessageSquare, Palette, Send, Shirt, Sparkles, TrendingUp } from 'lucide-react'
import { AppFrame, MetricCard } from '../../components/AppFrame'

type Clothing = { _id: string; category: string; primaryColor?: string; colors?: string[]; style?: string; wearCount?: number; createdAt?: string }
type Outfit = { _id?: string; title?: string; score: number; explanation?: string; tags?: string[]; breakdown?: Record<string, number> }
type Weather = { temperature: number; condition: string; suggestion: string; source: string }
type Preferences = { preferredStyles: string[]; preferredColors: string[]; favoriteCategories: string[] }
export default function DashboardPage() {
  const [wardrobe, setWardrobe] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [weather, setWeather] = useState<Weather | null>(null)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [feedback, setFeedback] = useState({ type: 'feedback', title: '', message: '' })
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [wardrobeRes, outfitsRes, weatherRes, preferencesRes, recommendRes] = await Promise.allSettled([
        fetch('/api/wardrobe').then((res) => res.json()),
        fetch('/api/outfits').then((res) => res.json()),
        fetch('/api/weather').then((res) => res.json()),
        fetch('/api/user/preferences').then((res) => res.json()),
        fetch('/api/outfits/recommend?occasion=casual&limit=3').then((res) => res.json())
      ])
      if (!active) return
      if (wardrobeRes.status === 'fulfilled' && Array.isArray(wardrobeRes.value)) setWardrobe(wardrobeRes.value)
      if (outfitsRes.status === 'fulfilled' && Array.isArray(outfitsRes.value)) setOutfits(outfitsRes.value)
      if (recommendRes.status === 'fulfilled' && Array.isArray(recommendRes.value?.outfits) && recommendRes.value.outfits.length) setOutfits((current) => current.length ? current : recommendRes.value.outfits)
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value)
      if (preferencesRes.status === 'fulfilled' && preferencesRes.value?.preferredStyles) setPreferences(preferencesRes.value)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const analytics = useMemo(() => {
    const colors = wardrobe.reduce<string[]>((allColors, item) => {
      const itemColors = item.colors?.length ? item.colors : [item.primaryColor || 'unknown']
      itemColors.forEach((color) => {
        if (color !== 'unknown') allColors.push(color)
      })
      return allColors
    }, [])
    const topColor = colors.sort((a, b) => colors.filter((x) => x === b).length - colors.filter((x) => x === a).length)[0] || 'unknown'
    const styles = wardrobe.map((item) => item.style).filter(Boolean) as string[]
    const favoriteStyle = styles.sort((a, b) => styles.filter((x) => x === b).length - styles.filter((x) => x === a).length)[0] || 'minimal'
    const score = outfits[0]?.score ? `${outfits[0].score}%` : wardrobe.length >= 3 ? 'Ready' : 'Setup'
    const worn = wardrobe.reduce((sum, item) => sum + Number(item.wearCount || 0), 0)
    return { topColor, favoriteStyle, score, worn }
  }, [outfits, wardrobe])

  async function submitFeedback(event: React.FormEvent) {
    event.preventDefault()
    setFeedbackStatus('sending')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    }).catch(() => null)

    if (res?.ok) {
      setFeedback({ type: 'feedback', title: '', message: '' })
      setFeedbackStatus('sent')
      window.setTimeout(() => setFeedbackStatus('idle'), 2500)
      return
    }
    setFeedbackStatus('error')
  }

  return (
    <AppFrame
      title="Style command center"
      eyebrow="Dashboard"
      action={<Link href="/wardrobe" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black">Upload clothing</Link>}
    >

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Wardrobe items" value={loading ? '...' : String(wardrobe.length)} note="Pieces available for local styling" />
        <MetricCard label="Best outfit score" value={analytics.score} note="Highest saved recommendation" />
        <MetricCard label="Favorite style" value={analytics.favoriteStyle} note="Detected from your closet" />
        <MetricCard label="Weather fit" value={weather ? `${weather.temperature}C` : 'Ready'} note={weather?.condition || 'Fallback enabled'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recommended today</h2>
              <p className="mt-1 text-sm text-white/45">Ranked by color, style, weather, occasion, and balance.</p>
            </div>
            <span className="flex items-center gap-2 rounded-[8px] bg-white/8 px-3 py-2 text-xs text-white/60">
              <CloudSun className="h-4 w-4" />
              {weather?.condition || 'moderate'}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {(outfits.length ? outfits.slice(0, 3) : [
              { title: 'Generate your first fit', score: wardrobe.length >= 3 ? 86 : 0, explanation: wardrobe.length >= 3 ? 'Your wardrobe has enough pieces for a local recommendation.' : 'Add a top, bottom, and shoes to unlock strong outfit generation.' }
            ]).map((outfit, index) => (
              <div key={outfit._id || index} className="rounded-[8px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{outfit.title || `Saved outfit ${index + 1}`}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{outfit.explanation}</p>
                  </div>
                  <span className="rounded-[8px] bg-white px-3 py-1 text-sm font-bold text-black">{outfit.score}</span>
                </div>
                {outfit.breakdown && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-white/45">
                    {Object.entries(outfit.breakdown).slice(0, 3).map(([key, value]) => (
                      <span key={key} className="rounded-[8px] bg-white/7 px-2 py-1 capitalize">{key.replace('Score', '')}: {value}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-white/70" />
              <h2 className="font-semibold">Color intelligence</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/52">Your strongest palette is currently {analytics.topColor}. Preferred colors: {preferences?.preferredColors?.slice(0, 3).join(', ') || 'learning from favorites'}.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
              <Shirt className="h-5 w-5 text-white/65" />
              <p className="mt-4 text-2xl font-semibold">{new Set(wardrobe.map((item) => item.category)).size}</p>
              <p className="text-sm text-white/45">Categories</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
              <Heart className="h-5 w-5 text-white/65" />
              <p className="mt-4 text-2xl font-semibold">{preferences?.preferredStyles?.[0] || analytics.favoriteStyle}</p>
              <p className="text-sm text-white/45">Preference profile</p>
            </div>
          </div>
          <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
            <TrendingUp className="h-5 w-5 text-white/65" />
            <p className="mt-4 text-sm leading-6 text-white/52">{weather?.suggestion || 'AI stylist tip: save and reject outfits to sharpen personalization over time.'} Wear tracking has logged {analytics.worn} total wears.</p>
          </div>
          <form onSubmit={submitFeedback} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-white/65" />
              <h2 className="font-semibold">Send feedback</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <select
                className="field"
                value={feedback.type}
                onChange={(event) => setFeedback((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="feedback">Feedback</option>
                <option value="bug">Bug report</option>
                <option value="feature">Feature request</option>
              </select>
              <input
                className="field"
                value={feedback.title}
                onChange={(event) => setFeedback((current) => ({ ...current, title: event.target.value }))}
                placeholder="Short title"
                required
              />
              <textarea
                className="field min-h-24 resize-none"
                value={feedback.message}
                onChange={(event) => setFeedback((current) => ({ ...current, message: event.target.value }))}
                placeholder="Tell us what happened or what you want next"
                required
              />
              <button disabled={feedbackStatus === 'sending'} className="flex items-center justify-center gap-2 rounded-[8px] bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60">
                <Send className="h-4 w-4" />
                {feedbackStatus === 'sending' ? 'Sending' : feedbackStatus === 'sent' ? 'Sent' : 'Submit'}
              </button>
              {feedbackStatus === 'error' ? <p className="text-sm text-red-300">Could not send feedback. Please try again.</p> : null}
            </div>
          </form>
          <Link href="/outfit-generator" className="flex items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-5 py-4 text-sm font-semibold text-black">
            <Sparkles className="h-4 w-4" />
            Generate combinations
          </Link>
        </section>
      </div>
    </AppFrame>
  )
}
