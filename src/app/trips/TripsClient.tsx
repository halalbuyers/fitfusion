"use client"

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Briefcase,
  CalendarDays,
  Check,
  Copy,
  Edit3,
  Loader2,
  MapPin,
  PackageCheck,
  Plane,
  Plus,
  RefreshCw,
  Shirt,
  ShoppingBag,
  Trash2,
  X
} from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'
import Toast from '../../components/Toast'

type ChecklistItem = { id: string; label: string; category: string; packed: boolean; quantity?: number; reason?: string }
type PackingItem = { id: string; label: string; category: string; quantity: number; reason: string; wardrobeItemId?: string; image?: string; owned: boolean }
type WeatherSnapshot = { temperature?: number; condition?: string; rain?: number; windKph?: number; uvIndex?: number }
type ScheduledOutfit = {
  date: string
  slot: 'morning' | 'evening' | 'night'
  weather?: WeatherSnapshot
  outfit?: {
    title?: string
    score?: number
    explanation?: string
    items?: Array<{ _id?: string; id?: string; image?: string; category?: string; primaryColor?: string; color?: string }>
  }
}
type TravelWeather = {
  date: string
  temperature: number
  condition: string
  rain: number
  windKph: number
  uvIndex: number
  morning?: { temperature: number; condition: string }
  afternoon?: { temperature: number; condition: string }
  night?: { temperature: number; condition: string }
  advice: string
  source?: string
}
type Trip = {
  _id: string
  destination: string
  startDate: string
  endDate: string
  purpose: string
  activities: string[]
  transportation: string
  travelStyle: string
  status: 'active' | 'archived'
  checklist: ChecklistItem[]
  plan: {
    days: number
    dates: string[]
    packingList: PackingItem[]
    scheduledOutfits: ScheduledOutfit[]
    laundry?: { needed: boolean; schedule: number[]; advice: string; reuseSchedule?: string[]; rotationPlan?: string }
    advice?: string[]
    weather?: TravelWeather[]
  }
}

const travelStyles = ['business', 'vacation', 'adventure', 'luxury', 'backpacking', 'beach', 'winter', 'road trip', 'wedding', 'conference']
const packingOrder = ['Tops', 'Bottoms', 'Shoes', 'Jackets', 'Formal wear', 'Gym wear', 'Accessories', 'Undergarments', 'Sleepwear', 'Travel essentials', 'Missing Essentials']

function todayInput(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function longDateLabel(value: string) {
  return new Date(value).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
}

function progress(checklist: ChecklistItem[]) {
  const packed = checklist.filter((item) => item.packed).length
  const total = checklist.length
  return { packed, total, percent: total ? Math.round((packed / total) * 100) : 0 }
}

function activitiesText(value?: string[]) {
  return (value || []).join(', ')
}

function groupPacking(items: PackingItem[]) {
  const groups = items.reduce<Record<string, PackingItem[]>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] || []), item]
    return acc
  }, {})
  return Object.entries(groups).sort(([a], [b]) => {
    const ai = packingOrder.indexOf(a)
    const bi = packingOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

function weatherLine(weather?: TravelWeather | WeatherSnapshot) {
  if (!weather) return 'Forecast pending'
  const temp = typeof weather.temperature === 'number' ? `${weather.temperature}C` : ''
  const condition = weather.condition || ''
  const rain = typeof weather.rain === 'number' ? `rain ${weather.rain}%` : ''
  return [temp, condition, rain].filter(Boolean).join(' / ') || 'Forecast pending'
}

function slotWeather(day?: TravelWeather, slot?: ScheduledOutfit['slot']) {
  if (!day) return undefined
  const period = slot === 'morning' ? day.morning : slot === 'night' ? day.night : day.afternoon
  return {
    temperature: period?.temperature ?? day.temperature,
    condition: period?.condition ?? day.condition,
    rain: day.rain,
    windKph: day.windKph,
    uvIndex: day.uvIndex
  }
}

function OutfitImages({ outfit }: { outfit?: ScheduledOutfit['outfit'] }) {
  const items = (outfit?.items || []).slice(0, 4)
  return (
    <div className="grid grid-cols-4 gap-px overflow-hidden rounded-[8px] bg-white/10">
      {items.map((item, index) => (
        <div key={item._id || item.id || index} className="relative aspect-square bg-black/35">
          {item.image ? (
            <Image src={item.image} alt={item.category || 'Trip outfit item'} fill sizes="100px" className="object-contain p-2" />
          ) : (
            <div className="grid h-full place-items-center text-white/20"><Shirt className="h-4 w-4" /></div>
          )}
        </div>
      ))}
      {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, index) => (
        <div key={`empty-${index}`} className="grid aspect-square place-items-center bg-black/35 text-white/20"><Shirt className="h-4 w-4" /></div>
      ))}
    </div>
  )
}

export default function TripsClient() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    destination: 'Paris',
    startDate: todayInput(14),
    endDate: todayInput(18),
    purpose: 'Business + Sightseeing',
    activities: 'meetings, museums, dinners, walking',
    transportation: 'Flight + Metro',
    travelStyle: 'business'
  })

  const selected = useMemo(() => trips.find((trip) => trip._id === selectedId) || trips[0], [selectedId, trips])
  const selectedProgress = selected ? progress(selected.checklist || []) : { packed: 0, total: 0, percent: 0 }
  const groupedPacking = useMemo(() => groupPacking(selected?.plan?.packingList || []), [selected])
  const missingEssentials = useMemo(() => (selected?.plan?.packingList || []).filter((item) => !item.owned && item.category === 'Missing Essentials'), [selected])

  async function loadTrips(nextSelectedId = selectedId) {
    setLoading(true)
    try {
      const res = await fetch('/api/trips')
      const data = await res.json()
      const next = Array.isArray(data) ? data : []
      setTrips(next)
      if (nextSelectedId && next.some((trip: Trip) => trip._id === nextSelectedId)) setSelectedId(nextSelectedId)
      else if (next[0]?._id) setSelectedId(next[0]._id)
      else setSelectedId('')
    } catch {
      setTrips([])
      setSelectedId('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrips('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected || editing) return
    setForm({
      destination: selected.destination,
      startDate: String(selected.startDate).slice(0, 10),
      endDate: String(selected.endDate).slice(0, 10),
      purpose: selected.purpose || '',
      activities: activitiesText(selected.activities),
      transportation: selected.transportation || '',
      travelStyle: selected.travelStyle || 'vacation'
    })
  }, [selected, editing])

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function createTrip(event: React.FormEvent) {
    event.preventDefault()
    setBusy(editing ? 'edit' : 'create')
    setError('')
    try {
      const res = await fetch('/api/trips', {
        method: editing && selected ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing && selected ? { id: selected._id, ...form } : form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create trip')
      setToast(editing ? 'Trip updated and outfits regenerated.' : 'Trip plan generated and linked to calendar.')
      setEditing(false)
      setSelectedId(data._id)
      await loadTrips(data._id)
    } catch (e: any) {
      setError(e.message || 'Could not create trip')
    } finally {
      setBusy('')
    }
  }

  async function patchTrip(body: Record<string, unknown>, message: string) {
    if (!selected) return
    setBusy(String(body.action || 'patch'))
    setError('')
    try {
      const res = await fetch('/api/trips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected._id, ...body })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setToast(message)
      setTrips((current) => current.map((trip) => trip._id === selected._id ? data : trip))
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setBusy('')
    }
  }

  async function duplicateTrip() {
    if (!selected) return
    setBusy('duplicate')
    setError('')
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateId: selected._id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Duplicate failed')
      setToast('Trip duplicated.')
      setSelectedId(data._id)
      await loadTrips(data._id)
    } catch (e: any) {
      setError(e.message || 'Duplicate failed')
    } finally {
      setBusy('')
    }
  }

  async function deleteTrip() {
    if (!selected) return
    setBusy('delete')
    setError('')
    try {
      const res = await fetch(`/api/trips?id=${selected._id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      setToast('Trip deleted.')
      setSelectedId('')
      setEditing(false)
      await loadTrips('')
    } catch (e: any) {
      setError(e.message || 'Delete failed')
    } finally {
      setBusy('')
    }
  }

  function toggleChecklist(itemId: string) {
    if (!selected) return
    const checklist = selected.checklist.map((item) => item.id === itemId ? { ...item, packed: !item.packed } : item)
    setTrips((current) => current.map((trip) => trip._id === selected._id ? { ...trip, checklist } : trip))
    patchTrip({ checklist }, 'Checklist updated.')
  }

  function startEditing() {
    if (!selected) return
    setEditing(true)
    setForm({
      destination: selected.destination,
      startDate: String(selected.startDate).slice(0, 10),
      endDate: String(selected.endDate).slice(0, 10),
      purpose: selected.purpose || '',
      activities: activitiesText(selected.activities),
      transportation: selected.transportation || '',
      travelStyle: selected.travelStyle || 'vacation'
    })
  }

  return (
    <AppFrame title="Trips" eyebrow="AI packing assistant">
      <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="grid gap-5 xl:sticky xl:top-5 xl:self-start">
          <form onSubmit={createTrip} className="glass rounded-[8px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">{editing ? 'Edit trip' : 'Trip planner'}</h2>
              </div>
              {editing ? (
                <button type="button" onClick={() => setEditing(false)} className="icon-button h-9 w-9" title="Cancel editing">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3">
              <input aria-label="Destination" value={form.destination} onChange={(event) => update('destination', event.target.value)} className="field h-11" placeholder="Destination" required />
              <div className="grid grid-cols-2 gap-3">
                <input aria-label="Start date" type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} className="field h-11 py-0" required />
                <input aria-label="End date" type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} className="field h-11 py-0" required />
              </div>
              <input aria-label="Trip purpose" value={form.purpose} onChange={(event) => update('purpose', event.target.value)} className="field h-11" placeholder="Business + Sightseeing" />
              <input aria-label="Expected activities" value={form.activities} onChange={(event) => update('activities', event.target.value)} className="field h-11" placeholder="meetings, dinners, walking" />
              <input aria-label="Transportation" value={form.transportation} onChange={(event) => update('transportation', event.target.value)} className="field h-11" placeholder="Flight, car, train" />
              <select aria-label="Travel style" value={form.travelStyle} onChange={(event) => update('travelStyle', event.target.value)} className="field h-11 py-0 capitalize">
                {travelStyles.map((style) => <option key={style} value={style}>{style}</option>)}
              </select>
              <button disabled={busy === 'create' || busy === 'edit'} className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-4 text-sm font-semibold text-black disabled:opacity-60">
                {busy === 'create' || busy === 'edit' ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <RefreshCw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editing ? 'Update Trip' : 'Generate Trip'}
              </button>
            </div>
          </form>

          <section className="glass rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Saved trips</p>
            <div className="mt-3 grid gap-2">
              {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-[8px] bg-white/7" />) : trips.length ? trips.map((trip) => {
                const tripProgress = progress(trip.checklist || [])
                return (
                  <button key={trip._id} onClick={() => { setSelectedId(trip._id); setEditing(false) }} className={`rounded-[8px] border p-3 text-left transition ${selected?._id === trip._id ? 'border-[#d7ff55]/50 bg-[#d7ff55]/10' : 'border-white/10 bg-black/20 hover:bg-white/8'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{trip.destination}</p>
                        <p className="mt-1 text-xs capitalize text-white/42">{dateLabel(trip.startDate)} - {dateLabel(trip.endDate)} / {trip.travelStyle}</p>
                      </div>
                      <span className="text-xs text-[#d7ff55]">{tripProgress.percent}%</span>
                    </div>
                    {trip.status === 'archived' ? <p className="mt-2 text-xs text-white/35">Archived</p> : null}
                  </button>
                )
              }) : <p className="text-sm text-white/42">No trips yet.</p>}
            </div>
          </section>
        </aside>

        <main className="grid gap-5">
          {error ? <p className="rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}
          {selected ? (
            <>
              <section className="glass rounded-[8px] p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex items-center gap-2 text-white/50">
                      <MapPin className="h-4 w-4 text-[#d7ff55]" />
                      <span className="text-xs uppercase tracking-[0.22em]">Trip overview</span>
                    </div>
                    <h2 className="mt-2 text-3xl font-semibold">{selected.destination}</h2>
                    <p className="mt-2 text-sm capitalize text-white/52">{dateLabel(selected.startDate)} - {dateLabel(selected.endDate)} / {selected.plan?.days || 0} days / {selected.purpose}</p>
                    <p className="mt-2 text-xs text-white/38">{activitiesText(selected.activities) || 'Activities flexible'} / {selected.transportation || 'transport TBD'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={startEditing} className="icon-button h-10 w-10" title="Edit trip"><Edit3 className="h-4 w-4" /></button>
                    <button type="button" onClick={duplicateTrip} className="icon-button h-10 w-10" title="Duplicate trip"><Copy className="h-4 w-4" /></button>
                    <button type="button" onClick={() => patchTrip({ action: 'archive' }, 'Trip archived.')} className="icon-button h-10 w-10" title="Archive trip"><Archive className="h-4 w-4" /></button>
                    <button type="button" onClick={deleteTrip} className="icon-button h-10 w-10 text-red-100" title="Delete trip"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {[
                    ['Checklist', `${selectedProgress.percent}%`, `${selectedProgress.packed}/${selectedProgress.total} packed`],
                    ['Outfits', String(selected.plan?.scheduledOutfits?.length || 0), 'morning/evening/night'],
                    ['Weather', selected.plan?.weather?.[0] ? `${selected.plan.weather[0].temperature}C` : 'Ready', selected.plan?.weather?.[0]?.condition || 'forecast'],
                    ['Laundry', selected.plan?.laundry?.needed ? 'Needed' : 'No', selected.plan?.laundry?.advice || 'compact packing']
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-[8px] bg-black/22 p-3">
                      <p className="text-xs text-white/40">{label}</p>
                      <p className="mt-1 text-2xl font-semibold">{value}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-white/42">{note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-[#d7ff55] transition-all" style={{ width: `${selectedProgress.percent}%` }} />
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="glass rounded-[8px] p-5">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-[#d7ff55]" />
                    <h2 className="font-semibold">Packing checklist</h2>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {(selected.checklist || []).map((item) => (
                      <button key={item.id} onClick={() => toggleChecklist(item.id)} className={`flex items-start gap-3 rounded-[8px] border p-3 text-left transition ${item.packed ? 'border-[#d7ff55]/30 bg-[#d7ff55]/10' : 'border-white/10 bg-black/20 hover:bg-white/8'}`}>
                        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${item.packed ? 'border-[#d7ff55] bg-[#d7ff55] text-black' : 'border-white/20 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{item.quantity && item.quantity > 1 ? `${item.quantity} ` : ''}{item.label}</span>
                          <span className="mt-1 block text-xs text-white/42">{item.category} / {item.reason}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5">
                  <section className="glass rounded-[8px] p-5">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[#d7ff55]" />
                      <h2 className="font-semibold">AI travel advice</h2>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {(selected.plan?.advice || []).map((item) => <p key={item} className="rounded-[8px] bg-black/22 p-3 text-sm leading-6 text-white/58">{item}</p>)}
                    </div>
                  </section>

                  <section className="glass rounded-[8px] p-5">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-[#d7ff55]" />
                      <h2 className="font-semibold">Smart packing list</h2>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {groupedPacking.map(([category, items]) => (
                        <div key={category} className="rounded-[8px] border border-white/10 bg-black/18 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{category}</p>
                            <span className="text-xs text-white/35">{items.length} items</span>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {items.map((item) => (
                              <div key={`${item.id}-${item.category}`} className="flex items-center gap-3 rounded-[8px] bg-white/[0.045] p-2.5">
                                {item.image ? (
                                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-black/35">
                                    <Image src={item.image} alt={item.label} fill sizes="44px" className="object-contain p-1" />
                                  </div>
                                ) : (
                                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-black/35 text-white/25">
                                    <Shirt className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm">{item.quantity > 1 ? `${item.quantity} ` : ''}{item.label}</p>
                                  <p className={`mt-1 text-xs ${item.owned ? 'text-[#d7ff55]' : 'text-amber-200'}`}>{item.owned ? 'In wardrobe' : 'Recommended'} / {item.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <section className="glass rounded-[8px] p-5">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-[#d7ff55]" />
                    <h2 className="font-semibold">Weather timeline</h2>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {(selected.plan?.weather || []).slice(0, 12).map((day) => (
                      <div key={day.date} className="rounded-[8px] bg-black/22 p-3">
                        <div className="flex justify-between gap-3">
                          <p className="font-medium">{dateLabel(day.date)}</p>
                          <p className="text-[#d7ff55]">{day.temperature}C</p>
                        </div>
                        <p className="mt-1 text-xs capitalize text-white/42">{day.condition} / rain {day.rain}% / wind {day.windKph}kph / UV {day.uvIndex}</p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/42">{day.advice}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass rounded-[8px] p-5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-[#d7ff55]" />
                    <h2 className="font-semibold">Laundry and rotation</h2>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[8px] bg-black/22 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35">Laundry days</p>
                      <p className="mt-2 text-lg font-semibold">{selected.plan?.laundry?.needed ? selected.plan.laundry.schedule.map((day) => `Day ${day}`).join(', ') : 'No laundry needed'}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">{selected.plan?.laundry?.rotationPlan || selected.plan?.laundry?.advice || 'Repeat bottoms, jackets, and shoes while rotating fresh tops.'}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(selected.plan?.laundry?.reuseSchedule || ['Rewear bottoms 2-3 times', 'Reuse jackets and accessories']).map((item) => (
                        <p key={item} className="rounded-[8px] bg-white/[0.045] p-3 text-sm text-white/56">{item}</p>
                      ))}
                    </div>
                  </div>
                </section>
              </section>

              {missingEssentials.length ? (
                <section className="glass rounded-[8px] p-5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-amber-200" />
                    <h2 className="font-semibold">Missing essentials</h2>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {missingEssentials.map((item) => (
                      <article key={item.id} className="rounded-[8px] border border-amber-200/18 bg-amber-200/8 p-4">
                        <p className="font-semibold text-amber-100">{item.label}</p>
                        <p className="mt-2 text-sm leading-6 text-white/55">{item.reason}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="glass rounded-[8px] p-5">
                <div className="flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-[#d7ff55]" />
                  <h2 className="font-semibold">Daily outfit timeline</h2>
                </div>
                <div className="mt-5 grid gap-4">
                  {(selected.plan?.dates || []).map((date, dayIndex) => {
                    const dayOutfits = (selected.plan?.scheduledOutfits || []).filter((entry) => entry.date === date)
                    const dayWeather = (selected.plan?.weather || []).find((entry) => entry.date === date)
                    return (
                      <article key={date} className="rounded-[8px] border border-white/10 bg-black/18 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-white/35">Day {dayIndex + 1} / {longDateLabel(date)}</p>
                        <div className="mt-3 grid gap-3 lg:grid-cols-3">
                          {dayOutfits.map((entry) => {
                            const weather = entry.weather || slotWeather(dayWeather, entry.slot)
                            return (
                              <div key={`${entry.date}-${entry.slot}`} className="rounded-[8px] bg-white/[0.045] p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold capitalize">{entry.slot}</p>
                                  <span className="text-xs text-[#d7ff55]">{entry.outfit?.score || 0}/100</span>
                                </div>
                                <p className="mt-1 text-xs capitalize text-white/38">{weatherLine(weather)}</p>
                                <div className="mt-3"><OutfitImages outfit={entry.outfit} /></div>
                                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/50">{entry.outfit?.explanation || 'Wardrobe outfit planned for this slot.'}</p>
                              </div>
                            )
                          })}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            </>
          ) : (
            <div className="glass rounded-[8px] p-10 text-center">
              <Plane className="mx-auto h-9 w-9 text-[#d7ff55]" />
              <h2 className="mt-4 text-xl font-semibold">Plan your first trip</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">Generate packing lists and daily outfits from clothes you already own.</p>
            </div>
          )}
        </main>
      </div>
      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}
    </AppFrame>
  )
}
