"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Heart,
  Image as ImageIcon,
  Layers3,
  Loader2,
  Maximize2,
  RefreshCw,
  Save,
  Scissors,
  Share2,
  Sparkles,
  Upload,
  Wand2,
  X
} from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'
import Toast from '../../components/Toast'
import { readApiJson } from '../../lib/api'

type Avatar = {
  _id: string
  name: string
  sourceType: 'selfie' | 'full-body' | 'ai'
  imageUrl: string
  active: boolean
  bodyAnalysis?: {
    heightEstimateCm?: number
    confidence?: number
    pose?: string
    proportions?: { shoulderToWaist?: number; torsoToLeg?: number; stanceWidth?: number }
  }
}

type LayerPlan = {
  id: string
  role: string
  category?: string
  image: string
  color?: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
  zIndex: number
  transform?: string
}

type TryOnLook = {
  _id: string
  title: string
  occasion: string
  originalImageUrl: string
  previewUrl?: string
  favorite: boolean
  status: 'queued' | 'rendering' | 'complete' | 'failed'
  settings?: any
  layerPlan: LayerPlan[]
  outfitSnapshot?: {
    score?: number
    explanation?: string
    tags?: string[]
    items?: Array<{ id?: string; role?: string; clothing?: { image?: string; category?: string; primaryColor?: string; color?: string } }>
    weatherMatch?: { score?: number }
  }
  scores?: {
    colorHarmony: number
    fitBalance: number
    layering: number
    seasonMatch: number
    occasionMatch: number
    weatherScore: number
    styleScore: number
    overallStyleScore: number
    label: string
  }
  suggestions?: Array<{ id: string; label: string; reason: string; action: string; active?: boolean }>
  photoStudio?: { theme: string; prompt: string; status: string; productionNotes?: string[] }
}

const styleVariations = ['minimal', 'streetwear', 'luxury', 'old money', 'techwear', 'korean', 'business casual', 'monochrome', 'summer', 'winter']
const poses = ['standing', 'walking', 'sitting', 'mirror selfie', 'street photography', 'studio pose']
const backgrounds = ['luxury store', 'street', 'office', 'coffee shop', 'beach', 'airport', 'home', 'studio']
const lightings = ['golden hour', 'indoor', 'studio', 'night', 'soft light', 'natural daylight']
const themes = ['magazine cover', 'luxury fashion', 'instagram reel cover', 'street fashion', 'studio portrait', 'lookbook', 'travel', 'night city']
const occasions = ['casual', 'office', 'formal', 'travel', 'party', 'wedding', 'gym', 'streetwear']
const weather = ['warm', 'hot', 'cool', 'cold', 'rainy', 'windy']

function friendlyError(message?: string) {
  const text = String(message || '').toLowerCase()
  if (text.includes('unauthorized') || text.includes('sign in')) return 'Please sign in to use Virtual Try-On.'
  if (text.includes('session')) return 'Your session has expired. Please sign in again.'
  if (text.includes('database')) return 'AI service is temporarily unavailable.'
  if (text.includes('avatar')) return message || 'Create or upload an avatar first.'
  if (text.includes('wardrobe')) return message || 'Add wardrobe items before rendering.'
  if (text.includes('render') || text.includes('outfit')) return message || 'Unable to render outfit.'
  return message && !message.includes('Unexpected token') ? message : 'Something went wrong. Please try again.'
}

async function readApi<T>(res: Response): Promise<T> {
  try {
    return await readApiJson<T>(res, 'Something went wrong. Please try again.')
  } catch (error) {
    throw new Error(friendlyError(error instanceof Error ? error.message : 'Something went wrong. Please try again.'))
  }
}

function logTryOnError(error: unknown) {
  if (process.env.NODE_ENV !== 'production') console.error('[Virtual Try-On]', error)
}

function todayInput(offset = 1) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function scoreTone(score = 0) {
  if (score >= 92) return 'bg-[#d7ff55] text-black'
  if (score >= 82) return 'bg-white text-black'
  return 'bg-white/12 text-white'
}

function backgroundClass(look?: TryOnLook) {
  return look?.settings?.backgroundTreatment?.gradient || 'from-[#090909] via-[#181b20] to-[#0b0c0f]'
}

function AvatarImageLayer({ src, fit = 'contain', className = '' }: { src: string; fit?: 'contain' | 'cover'; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-full w-full bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url("${src}")`, backgroundSize: fit }}
    />
  )
}

function metricLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').trim()
}

function AvatarComposite({ look, slider = 100, compact = false }: { look?: TryOnLook; slider?: number; compact?: boolean }) {
  if (!look) {
    return (
      <div className="grid h-full min-h-[460px] place-items-center rounded-[8px] border border-dashed border-white/12 bg-black/24 text-center">
        <div>
          <Sparkles className="mx-auto h-9 w-9 text-[#d7ff55]" />
          <p className="mt-4 text-lg font-semibold">Render your first look</p>
          <p className="mt-2 text-sm text-white/45">Upload an avatar or create one, then generate previews from your wardrobe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-[8px] bg-gradient-to-br ${backgroundClass(look)} ${compact ? 'aspect-[4/5]' : 'min-h-[620px]'}`}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[length:80px_80px] opacity-15" />
      <div className={`absolute inset-0 ${look.settings?.lightingTreatment?.overlay || 'bg-white/5'}`} />
      <div className="absolute inset-x-10 bottom-8 h-16 rounded-full bg-black/35 blur-2xl" />
      <div className={`absolute left-1/2 top-1/2 ${compact ? 'h-[84%] w-[74%]' : 'h-[88%] w-[58%] max-w-[520px]'} -translate-x-1/2 -translate-y-1/2`}>
        <div className="absolute inset-0 overflow-hidden rounded-[8px]" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
          <AvatarImageLayer src={look.originalImageUrl} />
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-[8px]" style={{ clipPath: `inset(0 0 0 ${slider}%)` }}>
          <AvatarImageLayer src={look.originalImageUrl} className="opacity-95 saturate-[1.08] contrast-[1.04]" />
          {look.layerPlan?.map((layer) => (
            <div
              key={`${layer.id}-${layer.role}`}
              className="absolute overflow-hidden rounded-[8px] border border-white/10 bg-white/7 shadow-2xl shadow-black/25 backdrop-blur-[1px]"
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}%`,
                height: `${layer.height}%`,
                opacity: layer.opacity,
                zIndex: layer.zIndex,
                transform: layer.transform
              }}
            >
              <Image src={layer.image} alt={layer.category || layer.role} fill sizes="240px" className="object-contain p-2 mix-blend-screen" />
            </div>
          ))}
        </div>
        {slider > 0 && slider < 100 ? (
          <div className="absolute inset-y-0 z-20 w-px bg-[#d7ff55]" style={{ left: `${slider}%` }}>
            <div className="absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#d7ff55]/40 bg-black/80">
              <Scissors className="h-4 w-4 text-[#d7ff55]" />
            </div>
          </div>
        ) : null}
      </div>
      <div className="absolute left-4 top-4 rounded-[8px] border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/50 backdrop-blur">
        {look.settings?.pose || 'studio pose'}
      </div>
      <div className="absolute bottom-4 right-4 rounded-[8px] bg-[#d7ff55] px-3 py-2 text-sm font-black text-black">
        {look.scores?.overallStyleScore || 0}/100
      </div>
    </div>
  )
}

export default function TryOnStudioClient() {
  const { isLoaded, userId } = useAuth()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [looks, setLooks] = useState<TryOnLook[]>([])
  const [selectedAvatarId, setSelectedAvatarId] = useState('')
  const [selectedLookId, setSelectedLookId] = useState('')
  const [selectedCompare, setSelectedCompare] = useState<string[]>([])
  const [compareSummary, setCompareSummary] = useState<{ summary: string; reasons: string[] } | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [slider, setSlider] = useState(58)
  const [scheduleDate, setScheduleDate] = useState(todayInput())
  const [settings, setSettings] = useState({
    styleVariation: 'luxury',
    pose: 'studio pose',
    background: 'luxury store',
    lighting: 'studio',
    photoTheme: 'lookbook',
    occasion: 'casual',
    weather: 'warm'
  })

  const selectedAvatar = useMemo(() => avatars.find((avatar) => avatar._id === selectedAvatarId) || avatars[0], [avatars, selectedAvatarId])
  const selectedLook = useMemo(() => looks.find((look) => look._id === selectedLookId) || looks[0], [looks, selectedLookId])
  const isGenerating = busy === 'render' || busy === 'photoshoot'
  const signInHref = '/login?redirect_url=/try-on'

  function reportError(errorValue: unknown, fallback: string) {
    const raw = errorValue instanceof Error ? errorValue.message : typeof errorValue === 'string' ? errorValue : fallback
    const message = friendlyError(raw || fallback)
    setError(message)
    setToast({ message, type: 'error' })
    return message
  }

  function canUseStudio() {
    if (!isLoaded) return false
    if (!userId) {
      const message = 'Please sign in to use Virtual Try-On.'
      setAuthMessage(message)
      setError('')
      setToast({ message, type: 'error' })
      return false
    }
    setAuthMessage('')
    return true
  }

  async function loadAll() {
    const [avatarRes, lookRes] = await Promise.all([
      fetch('/api/tryon/avatar'),
      fetch('/api/tryon/looks')
    ])
    const avatarData = await readApi<Avatar[]>(avatarRes)
    const lookData = await readApi<TryOnLook[]>(lookRes)
    const nextAvatars = Array.isArray(avatarData) ? avatarData : []
    const nextLooks = Array.isArray(lookData) ? lookData : []
    setAvatars(nextAvatars)
    setLooks(nextLooks)
    if (!selectedAvatarId && nextAvatars[0]?._id) setSelectedAvatarId(nextAvatars[0]._id)
    if (!selectedLookId && nextLooks[0]?._id) setSelectedLookId(nextLooks[0]._id)
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!userId) {
      setAuthMessage('Please sign in to use Virtual Try-On.')
      setInitialLoading(false)
      return
    }

    setAuthMessage('')
    setInitialLoading(true)
    loadAll().catch((loadError) => {
      const message = friendlyError(loadError?.message)
      if (message.includes('sign in')) setAuthMessage(message)
      else {
        setError(message)
        setToast({ message, type: 'error' })
      }
      logTryOnError(loadError)
    }).finally(() => setInitialLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId])

  useEffect(() => {
    if (!['render', 'photoshoot'].includes(busy)) {
      setProgress(0)
      return
    }

    setProgress(12)
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(92, current + (current < 50 ? 12 : 6)))
    }, 380)
    return () => window.clearInterval(timer)
  }, [busy])

  function update(key: keyof typeof settings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  async function createAiAvatar() {
    if (!canUseStudio()) return
    setBusy('avatar-ai')
    setError('')
    try {
      const res = await fetch('/api/tryon/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'AI Studio Avatar', style: settings.styleVariation })
      })
      const data = await readApi<Avatar>(res)
      setToast({ message: 'AI avatar created.', type: 'success' })
      await loadAll()
      setSelectedAvatarId(data._id)
    } catch (e: any) {
      reportError(e, 'Could not create avatar')
      logTryOnError(e)
    } finally {
      setBusy('')
    }
  }

  async function uploadAvatar(file?: File) {
    if (!canUseStudio()) return
    if (!file) return
    setBusy('avatar-upload')
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('name', file.name.replace(/\.[^.]+$/, '') || 'Uploaded avatar')
      form.append('sourceType', 'full-body')
      const res = await fetch('/api/tryon/avatar', { method: 'POST', body: form })
      const data = await readApi<Avatar>(res)
      setToast({ message: 'Avatar uploaded securely.', type: 'success' })
      await loadAll()
      setSelectedAvatarId(data._id)
    } catch (e: any) {
      reportError(e, 'Could not upload avatar')
      logTryOnError(e)
    } finally {
      setBusy('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function renderLooks(photoMode = false) {
    if (!canUseStudio()) return
    if (!selectedAvatar?._id) {
      const message = 'Create or upload an avatar first.'
      setError(message)
      setToast({ message, type: 'error' })
      return
    }
    setBusy(photoMode ? 'photoshoot' : 'render')
    setError('')
    setCompareSummary(null)
    try {
      const res = await fetch('/api/tryon/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarId: selectedAvatar._id, settings: { ...settings, photoTheme: photoMode ? settings.photoTheme : '' }, limit: photoMode ? 4 : 8 })
      })
      const data = await readApi<TryOnLook[]>(res)
      const next = Array.isArray(data) ? data : []
      setLooks((current) => {
        const byId = new Map(current.map((look) => [look._id, look]))
        next.forEach((look) => byId.set(look._id, look))
        return [...byId.values()].sort((a, b) => Number(b.scores?.overallStyleScore || 0) - Number(a.scores?.overallStyleScore || 0))
      })
      if (next[0]?._id) setSelectedLookId(next[0]._id)
      setProgress(100)
      setToast({ message: photoMode ? 'Photoshoot looks queued.' : 'Try-on previews ready.', type: 'success' })
    } catch (e: any) {
      reportError(e, 'Could not render looks')
      logTryOnError(e)
    } finally {
      setBusy('')
    }
  }

  async function patchLook(id: string, body: Record<string, unknown>, message: string) {
    if (!canUseStudio()) return
    setBusy(String(body.action || body.appliedSuggestion || 'patch'))
    setError('')
    try {
      const res = await fetch('/api/tryon/looks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body })
      })
      const data = await readApi<TryOnLook>(res)
      setLooks((current) => current.map((look) => look._id === id ? data : look))
      setToast({ message, type: 'success' })
    } catch (e: any) {
      reportError(e, 'Update failed')
      logTryOnError(e)
    } finally {
      setBusy('')
    }
  }

  async function saveLook() {
    if (!canUseStudio()) return
    if (!selectedLook) return
    setBusy('save')
    setError('')
    try {
      const res = await fetch('/api/tryon/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', id: selectedLook._id })
      })
      await readApi<{ look: TryOnLook }>(res)
      await patchLook(selectedLook._id, { favorite: true }, 'Look saved for reuse.')
    } catch (e: any) {
      reportError(e, 'Could not save look')
      logTryOnError(e)
    } finally {
      setBusy('')
    }
  }

  async function scheduleLook() {
    if (!canUseStudio()) return
    if (!selectedLook) return
    setBusy('schedule')
    setError('')
    try {
      const res = await fetch('/api/tryon/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule', id: selectedLook._id, date: scheduleDate })
      })
      await readApi<{ outfit: unknown; plan: unknown }>(res)
      setToast({ message: 'Look scheduled on calendar.', type: 'success' })
    } catch (e: any) {
      reportError(e, 'Could not schedule look')
      logTryOnError(e)
    } finally {
      setBusy('')
    }
  }

  async function compareLooks() {
    if (!canUseStudio()) return
    const ids = selectedCompare.length ? selectedCompare : looks.slice(0, 4).map((look) => look._id)
    setBusy('compare')
    setError('')
    try {
      const res = await fetch('/api/tryon/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compare', ids })
      })
      const data = await readApi<{ summary: string; reasons: string[] }>(res)
      setCompareSummary(data)
    } catch (e: any) {
      reportError(e, 'Compare failed')
      logTryOnError(e)
    } finally {
      setBusy('')
    }
  }

  async function shareLook() {
    if (!selectedLook) return
    const text = `${selectedLook.title} scored ${selectedLook.scores?.overallStyleScore || 0}/100 in Noir Closet Virtual Try-On Studio.`
    if (navigator.share) {
      await navigator.share({ title: selectedLook.title, text }).catch(() => undefined)
      return
    }
    await navigator.clipboard?.writeText(text).catch(() => undefined)
    setToast({ message: 'Share text copied.', type: 'success' })
  }

  function downloadLook() {
    if (!selectedLook?.previewUrl) return
    const link = document.createElement('a')
    link.href = selectedLook.previewUrl
    link.download = `${selectedLook.title || 'noir-try-on'}.jpg`
    link.click()
  }

  function move(delta: number) {
    if (!looks.length) return
    const index = Math.max(0, looks.findIndex((look) => look._id === selectedLook?._id))
    const next = looks[(index + delta + looks.length) % looks.length]
    if (next) setSelectedLookId(next._id)
  }

  return (
    <AppFrame title="Virtual Try-On Studio" eyebrow="AI fashion preview">
      {authMessage ? (
        <section className="glass mb-5 rounded-[8px] border border-[#d7ff55]/25 bg-[#d7ff55]/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#e8ff91]">Private studio</p>
              <h2 className="mt-2 text-xl font-semibold">{authMessage}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">Your avatar photos and generated looks stay isolated to your account.</p>
            </div>
            <Link href={signInHref} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-white px-5 text-sm font-semibold text-black">
              Sign in
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="grid gap-5">
          <section className="glass overflow-hidden rounded-[8px] p-3 sm:p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">Vision preview</p>
                <h2 className="mt-2 text-2xl font-semibold">{selectedLook?.title || 'AI wardrobe mirror'}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => move(-1)} className="icon-button h-10 w-10" title="Previous look"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(1)} className="icon-button h-10 w-10" title="Next look"><ChevronRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => setFullscreen(true)} className="icon-button h-10 w-10" title="Open fullscreen"><Maximize2 className="h-4 w-4" /></button>
              </div>
            </div>
            {initialLoading ? (
              <div className="grid min-h-[620px] place-items-center rounded-[8px] border border-white/10 bg-black/24">
                <div className="grid gap-4 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#d7ff55]" />
                  <p className="text-sm text-white/50">Loading your private Try-On Studio...</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <AvatarComposite look={selectedLook} slider={slider} />
                {isGenerating ? (
                  <div className="absolute inset-0 grid place-items-center rounded-[8px] bg-black/64 p-5 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[8px] border border-white/12 bg-black/72 p-5 shadow-2xl">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[#d7ff55]" />
                        <div>
                          <p className="font-semibold">Generating your preview...</p>
                          <p className="mt-1 text-xs text-white/45">Rendering wardrobe items onto your avatar.</p>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[#d7ff55] transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-[8px] bg-white/8" />)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <label htmlFor="before-after-slider" className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/35">Before / after</span>
                <input id="before-after-slider" aria-label="Before and after slider" type="range" min={0} max={100} value={slider} onChange={(event) => setSlider(Number(event.target.value))} className="w-full accent-[#d7ff55]" />
              </label>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-[8px] bg-black/25 p-3">
                  <p className="text-white/38">Weather</p>
                  <p className="mt-1 font-semibold text-white">{selectedLook?.scores?.weatherScore || 0}</p>
                </div>
                <div className="rounded-[8px] bg-black/25 p-3">
                  <p className="text-white/38">Style</p>
                  <p className="mt-1 font-semibold text-white">{selectedLook?.scores?.styleScore || 0}</p>
                </div>
                <div className={`rounded-[8px] p-3 font-black ${scoreTone(selectedLook?.scores?.overallStyleScore)}`}>
                  {selectedLook?.scores?.overallStyleScore || 0}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <div className="glass rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">Outfit carousel</h2>
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {isGenerating ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 w-56 shrink-0 animate-pulse rounded-[8px] bg-white/7" />) : null}
                {looks.map((look) => (
                  <button key={look._id} type="button" onClick={() => setSelectedLookId(look._id)} className={`w-60 shrink-0 rounded-[8px] border p-2 text-left transition ${selectedLook?._id === look._id ? 'border-[#d7ff55]/60 bg-[#d7ff55]/10' : 'border-white/10 bg-black/22 hover:bg-white/8'}`}>
                    <AvatarComposite look={look} compact />
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{look.title}</p>
                        <p className="mt-1 text-xs capitalize text-white/42">{look.occasion} / {look.settings?.styleVariation}</p>
                      </div>
                      <span className={`rounded-[8px] px-2 py-1 text-xs font-black ${scoreTone(look.scores?.overallStyleScore)}`}>{look.scores?.overallStyleScore || 0}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/45">
                      <span className="rounded-[8px] bg-white/7 px-2 py-1.5">Weather {look.scores?.weatherScore || 0}</span>
                      <span className="rounded-[8px] bg-white/7 px-2 py-1.5">Style {look.scores?.styleScore || 0}</span>
                    </div>
                  </button>
                ))}
                {!looks.length && !isGenerating ? <p className="text-sm text-white/45">No rendered looks yet.</p> : null}
              </div>
            </div>

            <div className="glass rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">AI rating</h2>
              </div>
              {selectedLook?.scores ? (
                <div className="mt-4 grid gap-2">
                  {Object.entries(selectedLook.scores).filter(([key]) => key !== 'label').map(([key, value]) => (
                    <div key={key} className="rounded-[8px] bg-black/22 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="capitalize text-white/55">{metricLabel(key)}</span>
                        <strong>{String(value)}</strong>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-[#d7ff55]" style={{ width: `${Number(value) || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-4 text-sm text-white/45">Scores appear after rendering.</p>}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="glass rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">AI suggestions</h2>
              </div>
              <div className="mt-4 grid gap-2">
                {(selectedLook?.suggestions || []).map((suggestion) => (
                  <button key={suggestion.id} type="button" onClick={() => selectedLook && patchLook(selectedLook._id, { appliedSuggestion: suggestion.id }, 'Suggestion applied to preview.')} className={`rounded-[8px] border p-3 text-left transition ${suggestion.active ? 'border-[#d7ff55]/50 bg-[#d7ff55]/10' : 'border-white/10 bg-black/22 hover:bg-white/8'}`}>
                    <p className="font-medium">{suggestion.label}</p>
                    <p className="mt-1 text-sm leading-6 text-white/48">{suggestion.reason}</p>
                  </button>
                ))}
                {!selectedLook?.suggestions?.length ? <p className="text-sm text-white/45">Render a look to receive swap, layer, and accessory suggestions.</p> : null}
              </div>
            </div>

            <div className="glass rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">Compare looks</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {looks.slice(0, 4).map((look) => (
                  <button key={look._id} type="button" onClick={() => setSelectedCompare((current) => current.includes(look._id) ? current.filter((id) => id !== look._id) : [...current, look._id].slice(-4))} className={`rounded-[8px] border p-2 text-left ${selectedCompare.includes(look._id) ? 'border-[#d7ff55]/60 bg-[#d7ff55]/10' : 'border-white/10 bg-black/22'}`}>
                    <AvatarComposite look={look} compact />
                    <p className="mt-2 truncate text-xs font-semibold">{look.title}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={compareLooks} disabled={!looks.length || busy === 'compare'} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black disabled:opacity-50">
                {busy === 'compare' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Compare
              </button>
              {compareSummary ? (
                <div className="mt-4 rounded-[8px] bg-black/22 p-3">
                  <p className="text-sm leading-6 text-white/62">{compareSummary.summary}</p>
                  <div className="mt-3 grid gap-1 text-xs text-white/42">
                    {compareSummary.reasons.map((reason) => <p key={reason}>{reason}</p>)}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </main>

        <aside className="grid gap-5 2xl:sticky 2xl:top-5 2xl:self-start">
          <section className="glass rounded-[8px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">AI avatar</h2>
              </div>
              <input id="try-on-avatar-upload" name="avatarImage" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => uploadAvatar(event.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} className="icon-button h-10 w-10" title="Upload avatar"><Upload className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3">
              {!avatars.length && !initialLoading ? (
                <div className="rounded-[8px] border border-dashed border-[#d7ff55]/28 bg-[#d7ff55]/8 p-4 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-[8px] bg-white text-black">
                    <Camera className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">No avatar yet</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">Upload a full-body photo or create an AI avatar before rendering outfits.</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={!userId || busy === 'avatar-upload'} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black disabled:opacity-50">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </button>
                    <button type="button" onClick={createAiAvatar} disabled={!userId || busy === 'avatar-ai'} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/8 text-sm text-white/75 disabled:opacity-50">
                      {busy === 'avatar-ai' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Create AI Avatar
                    </button>
                  </div>
                </div>
              ) : null}
              {avatars.map((avatar) => (
                <button key={avatar._id} type="button" onClick={() => setSelectedAvatarId(avatar._id)} className={`flex items-center gap-3 rounded-[8px] border p-2 text-left ${selectedAvatar?._id === avatar._id ? 'border-[#d7ff55]/60 bg-[#d7ff55]/10' : 'border-white/10 bg-black/22'}`}>
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[8px] bg-black/35">
                    <AvatarImageLayer src={avatar.imageUrl} fit="cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{avatar.name}</p>
                    <p className="mt-1 text-xs text-white/42">{avatar.sourceType} / {avatar.bodyAnalysis?.confidence || 0}% detection</p>
                  </div>
                </button>
              ))}
              <button type="button" onClick={createAiAvatar} disabled={!userId || busy === 'avatar-ai'} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/8 text-sm text-white/75 transition hover:bg-white/12 disabled:opacity-50">
                {busy === 'avatar-ai' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Create AI Avatar
              </button>
            </div>
          </section>

          <section className="glass rounded-[8px] p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-[#d7ff55]" />
              <h2 className="font-semibold">Studio controls</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ['Style', 'styleVariation', styleVariations],
                ['Pose', 'pose', poses],
                ['Background', 'background', backgrounds],
                ['Lighting', 'lighting', lightings],
                ['Occasion', 'occasion', occasions],
                ['Weather', 'weather', weather]
              ].map(([label, key, options]) => (
                <label key={String(key)} className="block">
                  <span className="mb-1 block text-xs text-white/40">{String(label)}</span>
                  <select id={`try-on-${String(key)}`} name={String(key)} value={settings[key as keyof typeof settings]} onChange={(event) => update(key as keyof typeof settings, event.target.value)} className="field h-10 py-0 capitalize">
                    {(options as string[]).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              ))}
              <button type="button" onClick={() => renderLooks(false)} disabled={!userId || !selectedAvatar || busy === 'render'} className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] text-sm font-semibold text-black disabled:opacity-50">
                {busy === 'render' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {selectedAvatar ? 'Render Try-On' : 'Add Avatar First'}
              </button>
              {!selectedAvatar ? <p className="text-xs leading-5 text-white/42">Rendering unlocks after an avatar is available.</p> : null}
            </div>
          </section>

          <section className="glass rounded-[8px] p-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#d7ff55]" />
              <h2 className="font-semibold">Photoshoot mode</h2>
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-white/40">Editorial theme</span>
              <select id="try-on-photo-theme" name="photoTheme" value={settings.photoTheme} onChange={(event) => update('photoTheme', event.target.value)} className="field h-10 py-0 capitalize">
                {themes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => renderLooks(true)} disabled={!userId || !selectedAvatar || busy === 'photoshoot'} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white text-sm font-semibold text-black disabled:opacity-50">
              {busy === 'photoshoot' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Generate Editorial Set
            </button>
            {selectedLook?.photoStudio ? (
              <p className="mt-3 rounded-[8px] bg-black/22 p-3 text-xs leading-5 text-white/50">{selectedLook.photoStudio.prompt}</p>
            ) : null}
          </section>

          <section className="glass rounded-[8px] p-5">
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5 text-[#d7ff55]" />
              <h2 className="font-semibold">Save and share</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => selectedLook && patchLook(selectedLook._id, { favorite: !selectedLook.favorite }, selectedLook.favorite ? 'Removed favorite.' : 'Favorited.')} disabled={!selectedLook} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 text-sm text-white/70 disabled:opacity-50">
                <Heart className={`h-4 w-4 ${selectedLook?.favorite ? 'fill-[#d7ff55] text-[#d7ff55]' : ''}`} />
                Favorite
              </button>
              <button type="button" onClick={saveLook} disabled={!selectedLook || busy === 'save'} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
              <button type="button" onClick={downloadLook} disabled={!selectedLook} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 text-sm text-white/70 disabled:opacity-50">
                <Download className="h-4 w-4" />
                Download
              </button>
              <button type="button" onClick={shareLook} disabled={!selectedLook} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 text-sm text-white/70 disabled:opacity-50">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input id="try-on-schedule-date" name="scheduleDate" type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} className="field h-10 py-0" aria-label="Schedule date" />
              <button type="button" onClick={scheduleLook} disabled={!selectedLook || busy === 'schedule'} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-3 text-sm font-semibold text-black disabled:opacity-50">
                {busy === 'schedule' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                Schedule
              </button>
            </div>
          </section>

          {selectedAvatar ? (
            <section className="glass rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">Body detection</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-[8px] bg-black/22 p-3"><p className="text-white/38">Height</p><p className="mt-1 font-semibold">{selectedAvatar.bodyAnalysis?.heightEstimateCm || 0} cm</p></div>
                <div className="rounded-[8px] bg-black/22 p-3"><p className="text-white/38">Pose</p><p className="mt-1 font-semibold capitalize">{selectedAvatar.bodyAnalysis?.pose || 'standing'}</p></div>
                <div className="rounded-[8px] bg-black/22 p-3"><p className="text-white/38">Shoulder/Waist</p><p className="mt-1 font-semibold">{selectedAvatar.bodyAnalysis?.proportions?.shoulderToWaist || 0}</p></div>
                <div className="rounded-[8px] bg-black/22 p-3"><p className="text-white/38">Confidence</p><p className="mt-1 font-semibold">{selectedAvatar.bodyAnalysis?.confidence || 0}%</p></div>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {error ? <p className="mt-5 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}

      {fullscreen ? (
        <div className="fixed inset-0 z-50 bg-black/92 p-4 backdrop-blur-xl">
          <button type="button" onClick={() => setFullscreen(false)} className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-[8px] border border-white/10 bg-white/8">
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto h-full max-w-5xl">
            <AvatarComposite look={selectedLook} slider={slider} />
          </div>
        </div>
      ) : null}

      {toast && <Toast message={toast.message} type={toast.type === 'error' ? 'error' : 'success'} onClose={() => setToast(null)} />}
    </AppFrame>
  )
}
