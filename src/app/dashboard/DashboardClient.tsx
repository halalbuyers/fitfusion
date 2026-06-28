"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, Brain, CloudSun, Gauge, Heart, Layers, MessageSquare, Palette, Repeat2, Send, Shirt, ShoppingBag, Sparkles, Timer, TrendingUp } from 'lucide-react'
import { AppFrame, MetricCard } from '../../components/AppFrame'

type Clothing = { _id: string; image?: string; category: string; primaryColor?: string; colors?: string[]; style?: string; wearCount?: number; usageCount?: number; lastWornAt?: string | null; createdAt?: string }
type Outfit = { _id?: string; title?: string; score: number; explanation?: string; tags?: string[]; breakdown?: Record<string, number> }
type Weather = { temperature: number; condition: string; suggestion: string; source: string }
type Preferences = { preferredStyles: string[]; preferredColors: string[]; favoriteCategories: string[] }
type StyleProfile = {
  personalizationScore: number
  message: string
  favoriteColors: string[]
  favoriteCategories: string[]
  favoriteStyles: string[]
  seasonPreference: string[]
}
type CoverageMetric = { key: string; label: string; score: number; count: number; missing: string[]; recommendation: string }
type ConsultantAnalysis = {
  wardrobeScore: { score: number; label: string; factors: Record<string, number> }
  colorAnalysis: { distribution: Array<{ color: string; count: number; percent: number }>; balanceScore: number; dominantColor?: string; imbalance: string[]; suggestedColors: string[] }
  seasonCoverage: CoverageMetric[]
  occasionCoverage: CoverageMetric[]
  duplicates: Array<{ label: string; count: number; severity: string; recommendation: string }>
  missingEssentials: Array<{ title: string; reason: string; estimatedNewCombinations: number; estimatedImprovementPercent: number; priority: string }>
  shoppingRecommendations: Array<{ title: string; reason: string; estimatedNewCombinations: number; estimatedImprovementPercent: number }>
  unusedItems: Array<{ item: Clothing; daysUnused: number; timesWorn: number; action: string; reason: string }>
  outfitPotential: { possibleOutfits: number; trend: string; roles: Record<string, number> }
  favoriteItems: { mostWorn: Clothing[]; leastWorn: Clothing[]; mostVersatile: Clothing[]; highestRated: Clothing[] }
  tips: string[]
  recentUploads: Clothing[]
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/8">
      <div className="h-full rounded-full bg-[#d7ff55] transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  return (
    <div className="relative grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(#d7ff55 ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}>
      <div className="grid h-[118px] w-[118px] place-items-center rounded-full bg-[#080808] text-center">
        <div>
          <p className="text-4xl font-semibold">{score}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
        </div>
      </div>
    </div>
  )
}

function AnalyticsCard({ title, icon: Icon, children }: { title: string; icon: typeof BarChart3; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:bg-white/[0.055]">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#d7ff55]" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function DashboardPage() {
  const [wardrobe, setWardrobe] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [weather, setWeather] = useState<Weather | null>(null)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null)
  const [consultant, setConsultant] = useState<ConsultantAnalysis | null>(null)
  const [feedback, setFeedback] = useState({ type: 'feedback', title: '', message: '' })
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [wardrobeRes, outfitsRes, weatherRes, preferencesRes, recommendRes, styleProfileRes, consultantRes] = await Promise.allSettled([
        fetch('/api/wardrobe').then((res) => res.json()),
        fetch('/api/outfits').then((res) => res.json()),
        fetch('/api/weather').then((res) => res.json()),
        fetch('/api/user/preferences').then((res) => res.json()),
        fetch('/api/outfits/recommend?occasion=casual&limit=3').then((res) => res.json()),
        fetch('/api/user/style-profile').then((res) => res.json()),
        fetch('/api/wardrobe/analytics').then((res) => res.json())
      ])
      if (!active) return
      if (wardrobeRes.status === 'fulfilled' && Array.isArray(wardrobeRes.value)) setWardrobe(wardrobeRes.value)
      if (outfitsRes.status === 'fulfilled' && Array.isArray(outfitsRes.value)) setOutfits(outfitsRes.value)
      if (recommendRes.status === 'fulfilled' && Array.isArray(recommendRes.value?.outfits) && recommendRes.value.outfits.length) setOutfits((current) => current.length ? current : recommendRes.value.outfits)
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value)
      if (preferencesRes.status === 'fulfilled' && preferencesRes.value?.preferredStyles) setPreferences(preferencesRes.value)
      if (styleProfileRes.status === 'fulfilled' && typeof styleProfileRes.value?.personalizationScore === 'number') setStyleProfile(styleProfileRes.value)
      if (consultantRes.status === 'fulfilled' && consultantRes.value?.wardrobeScore) setConsultant(consultantRes.value)
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
        <MetricCard label="Wardrobe score" value={consultant ? `${consultant.wardrobeScore.score}/100` : analytics.score} note={consultant?.wardrobeScore.label || 'Highest saved recommendation'} />
        <MetricCard label="AI style memory" value={styleProfile ? `${styleProfile.personalizationScore}%` : 'Learning'} note={styleProfile?.message || 'AI understands your style as you interact'} />
        <MetricCard label="Possible outfits" value={consultant ? consultant.outfitPotential.possibleOutfits.toLocaleString() : 'Ready'} note={consultant?.outfitPotential.trend || weather?.condition || 'Fallback enabled'} />
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
      ) : consultant ? (
        <div className="mt-6 grid gap-4">
          <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
            <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
              <div className="flex justify-center lg:justify-start">
                <ScoreRing score={consultant.wardrobeScore.score} label={consultant.wardrobeScore.label} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-[#d7ff55]" />
                  <h2 className="text-xl font-semibold">Wardrobe health score</h2>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {Object.entries(consultant.wardrobeScore.factors).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="rounded-[8px] bg-black/22 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs capitalize text-white/50">
                        <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-semibold text-white">{value}</span>
                      </div>
                      <div className="mt-2"><ProgressBar value={value} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-3">
            <AnalyticsCard title="Color analysis" icon={Palette}>
              <div className="grid gap-3">
                {consultant.colorAnalysis.distribution.slice(0, 6).map((entry) => (
                  <div key={entry.color}>
                    <div className="mb-1 flex justify-between text-sm capitalize text-white/62"><span>{entry.color}</span><span>{entry.percent}%</span></div>
                    <ProgressBar value={entry.percent} />
                  </div>
                ))}
              </div>
              {consultant.colorAnalysis.imbalance[0] ? <p className="mt-4 text-sm leading-6 text-white/50">{consultant.colorAnalysis.imbalance[0]}</p> : null}
            </AnalyticsCard>

            <AnalyticsCard title="Occasion coverage" icon={Brain}>
              <div className="grid gap-2">
                {consultant.occasionCoverage.map((entry) => (
                  <div key={entry.key} className="grid grid-cols-[86px_1fr_42px] items-center gap-2 text-sm">
                    <span className="text-white/55">{entry.label}</span>
                    <ProgressBar value={entry.score} />
                    <span className="text-right text-white/62">{entry.score}%</span>
                  </div>
                ))}
              </div>
            </AnalyticsCard>

            <AnalyticsCard title="Season coverage" icon={CloudSun}>
              <div className="grid gap-3">
                {consultant.seasonCoverage.map((entry) => (
                  <div key={entry.key} className="rounded-[8px] bg-black/22 p-3">
                    <div className="flex justify-between text-sm"><span>{entry.label}</span><span>{entry.score}%</span></div>
                    <div className="mt-2"><ProgressBar value={entry.score} /></div>
                    {entry.score < 55 ? <p className="mt-2 text-xs text-white/42">{entry.recommendation}</p> : null}
                  </div>
                ))}
              </div>
            </AnalyticsCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <AnalyticsCard title="Duplicates" icon={Repeat2}>
              {consultant.duplicates.length ? consultant.duplicates.slice(0, 4).map((group) => (
                <div key={group.label} className="mb-2 rounded-[8px] bg-black/22 p-3">
                  <p className="text-sm font-medium">{group.label}</p>
                  <p className="mt-1 text-xs text-white/45">{group.recommendation}</p>
                </div>
              )) : <p className="text-sm text-white/50">No major duplicate clusters detected.</p>}
            </AnalyticsCard>

            <AnalyticsCard title="Missing essentials" icon={AlertTriangle}>
              {consultant.missingEssentials.slice(0, 4).map((item) => (
                <div key={item.title} className="mb-2 rounded-[8px] bg-black/22 p-3">
                  <div className="flex justify-between gap-3"><p className="text-sm font-medium">{item.title}</p><span className="text-xs text-[#d7ff55]">+{item.estimatedImprovementPercent}%</span></div>
                  <p className="mt-1 text-xs text-white/45">{item.reason}</p>
                </div>
              ))}
            </AnalyticsCard>

            <AnalyticsCard title="Unused items" icon={Timer}>
              {consultant.unusedItems.slice(0, 4).map((entry) => (
                <div key={entry.item._id || `${entry.item.category}-${entry.daysUnused}`} className="mb-2 rounded-[8px] bg-black/22 p-3">
                  <div className="flex justify-between gap-3"><p className="text-sm capitalize">{entry.item.category || 'Item'}</p><span className="text-xs capitalize text-white/45">{entry.action}</span></div>
                  <p className="mt-1 text-xs text-white/45">{entry.daysUnused} days unused · {entry.timesWorn} wears</p>
                </div>
              ))}
            </AnalyticsCard>

            <AnalyticsCard title="Shopping impact" icon={ShoppingBag}>
              {consultant.shoppingRecommendations.slice(0, 4).map((item) => (
                <div key={item.title} className="mb-2 rounded-[8px] bg-black/22 p-3">
                  <div className="flex justify-between gap-3"><p className="text-sm font-medium">{item.title}</p><span className="text-xs text-[#d7ff55]">+{item.estimatedNewCombinations}</span></div>
                  <p className="mt-1 text-xs text-white/45">new outfit combinations</p>
                </div>
              ))}
            </AnalyticsCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <AnalyticsCard title="AI fashion tips" icon={Sparkles}>
              <div className="grid gap-2">
                {consultant.tips.map((tip, index) => (
                  <p key={index} className="rounded-[8px] bg-black/22 p-3 text-sm leading-6 text-white/58">{tip}</p>
                ))}
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Recent uploads" icon={Layers}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {consultant.recentUploads.slice(0, 6).map((item) => (
                  <div key={item._id || item.image} className="rounded-[8px] bg-black/22 p-3">
                    <p className="truncate text-sm capitalize">{item.category}</p>
                    <p className="mt-1 truncate text-xs capitalize text-white/42">{item.primaryColor || item.colors?.[0] || 'unknown'} · {item.style || 'style'}</p>
                  </div>
                ))}
              </div>
            </AnalyticsCard>
          </div>
        </div>
      ) : null}

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
              <p className="mt-4 text-2xl font-semibold">{styleProfile?.favoriteStyles?.[0] || preferences?.preferredStyles?.[0] || analytics.favoriteStyle}</p>
              <p className="text-sm text-white/45">{styleProfile?.seasonPreference?.[0] ? `${styleProfile.seasonPreference[0]} preference` : 'Preference profile'}</p>
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
                id="feedback-type"
                name="type"
                aria-label="Feedback type"
                className="field"
                value={feedback.type}
                onChange={(event) => setFeedback((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="feedback">Feedback</option>
                <option value="bug">Bug report</option>
                <option value="feature">Feature request</option>
              </select>
              <input
                id="feedback-title"
                name="title"
                aria-label="Feedback title"
                className="field"
                value={feedback.title}
                onChange={(event) => setFeedback((current) => ({ ...current, title: event.target.value }))}
                placeholder="Short title"
                required
              />
              <textarea
                id="feedback-message"
                name="message"
                aria-label="Feedback message"
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
