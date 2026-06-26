"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Edit3,
  Loader2,
  PackageCheck,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Shirt,
  Sparkles,
  Trash2,
  Wand2
} from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'
import Toast from '../../components/Toast'

type CalendarView = 'month' | 'week' | 'day'
type CalendarStatus = 'planned' | 'worn' | 'skipped'

type Clothing = {
  _id: string
  image?: string
  category?: string
  primaryColor?: string
  color?: string
  style?: string
  wearCount?: number
  usageCount?: number
  lastWornAt?: string | null
}

type Outfit = {
  _id: string
  title: string
  occasion?: string
  score?: number
  explanation?: string
  confidence?: number
  tags?: string[]
  items?: Array<{ clothing?: Clothing; role?: string }>
}

type PlannerWeather = {
  temperature?: number
  condition?: string
  suggestion?: string
  source?: string
}

type CalendarPlan = {
  _id: string
  date: string
  dateKey?: string
  outfitId?: Outfit
  occasion: string
  weather?: PlannerWeather
  notes?: string
  status: CalendarStatus
}

type HistoryResponse = {
  mostWorn: Clothing[]
  leastWorn: Clothing[]
  lastWorn: Clothing[]
  statusCounts: Record<string, number>
}

type PackingItem = { item: string; quantity: number; reason: string }
type VacationResult = {
  destination: string
  days: number
  weather: PlannerWeather
  packingList: PackingItem[]
}

const occasions = ['casual', 'college', 'office', 'wedding', 'travel', 'gym', 'party', 'date', 'festival']
const views: CalendarView[] = ['month', 'week', 'day']
const statuses: CalendarStatus[] = ['planned', 'worn', 'skipped']
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfWeek(date: Date) {
  const next = startOfDay(date)
  next.setDate(next.getDate() - next.getDay())
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function inputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function viewDays(view: CalendarView, cursor: Date) {
  if (view === 'day') return [startOfDay(cursor)]
  if (view === 'week') {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }).map((_, index) => addDays(start, index))
  }

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfWeek(monthStart)
  return Array.from({ length: 42 }).map((_, index) => addDays(gridStart, index))
}

function rangeLabel(view: CalendarView, days: Date[], cursor: Date) {
  if (view === 'month') return cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  if (view === 'day') return days[0].toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const first = days[0]
  const last = days[days.length - 1]
  return `${first.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${last.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function statusTone(status: CalendarStatus) {
  if (status === 'worn') return 'bg-[#d7ff55] text-black'
  if (status === 'skipped') return 'bg-red-400/15 text-red-100'
  return 'bg-white/10 text-white/70'
}

function itemWearCount(item: Clothing) {
  return Number(item.wearCount || item.usageCount || 0)
}

function itemColor(item?: Clothing) {
  return item?.primaryColor || item?.color || 'unknown'
}

function planDateKey(plan: CalendarPlan) {
  return plan.dateKey || String(plan.date || '').slice(0, 10)
}

function shortWeather(weather?: PlannerWeather) {
  if (!weather) return 'Forecast pending'
  const temp = typeof weather.temperature === 'number' ? `${weather.temperature}C` : ''
  return [temp, weather.condition].filter(Boolean).join(' ') || 'Forecast pending'
}

function dayPlans(plans: CalendarPlan[], day: Date) {
  const key = inputDate(day)
  return plans.filter((plan) => planDateKey(plan) === key)
}

function confidenceScore(plan?: CalendarPlan) {
  const raw = plan?.outfitId?.confidence ?? plan?.outfitId?.score ?? 0
  return Math.round(Number(raw) || 0)
}

function PlanImages({ outfit, large = false }: { outfit?: Outfit; large?: boolean }) {
  const items = (outfit?.items || []).slice(0, 4)
  return (
    <div className={`grid grid-cols-4 gap-px overflow-hidden rounded-[8px] bg-white/10 ${large ? 'min-h-[170px]' : ''}`}>
      {items.map((entry, index) => entry.clothing?.image ? (
        <div key={`${entry.clothing._id}-${index}`} className={`relative aspect-square bg-black/35 ${large ? 'min-h-[120px]' : ''}`}>
          <Image src={entry.clothing.image} alt={entry.clothing.category || 'Wardrobe item'} fill sizes={large ? '180px' : '96px'} className="object-contain p-2" />
        </div>
      ) : (
        <div key={`empty-${index}`} className={`grid aspect-square place-items-center bg-black/35 text-white/25 ${large ? 'min-h-[120px]' : ''}`}>
          <Shirt className="h-4 w-4" />
        </div>
      ))}
      {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, index) => (
        <div key={`placeholder-${index}`} className={`grid aspect-square place-items-center bg-black/35 text-white/20 ${large ? 'min-h-[120px]' : ''}`}>
          <Shirt className="h-4 w-4" />
        </div>
      ))}
    </div>
  )
}

function HistoryList({ title, items }: { title: string; items: Clothing[] }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.length ? items.slice(0, 4).map((item) => (
          <div key={item._id} className="flex items-center gap-2">
            {item.image ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-[8px] bg-black/35">
                <Image src={item.image} alt={item.category || 'Wardrobe item'} fill sizes="40px" className="object-contain p-1" />
              </div>
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-white/8 text-white/35">
                <Shirt className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm capitalize text-white/76">{item.category || 'Item'}</p>
              <p className="text-xs capitalize text-white/38">{itemColor(item)} / {itemWearCount(item)} wears</p>
            </div>
          </div>
        )) : (
          <p className="text-sm text-white/42">No wear history yet.</p>
        )}
      </div>
    </div>
  )
}

function EmptyDayButton({ dateKey, onClick }: { dateKey: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-white/12 text-white/35 transition hover:border-[#d7ff55]/45 hover:bg-[#d7ff55]/5 hover:text-white"
    >
      <Plus className="h-5 w-5" />
      <span className="text-xs">Plan {dateKey}</span>
    </button>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month')
  const [cursorDate, setCursorDate] = useState(() => startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => inputDate(new Date()))
  const [occasion, setOccasion] = useState('college')
  const [notes, setNotes] = useState('')
  const [mode, setMode] = useState<'basic' | 'hybrid'>('basic')
  const [plans, setPlans] = useState<CalendarPlan[]>([])
  const [history, setHistory] = useState<HistoryResponse>({ mostWorn: [], leastWorn: [], lastWorn: [], statusCounts: {} })
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const [draftOccasions, setDraftOccasions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [vacationDestination, setVacationDestination] = useState('')
  const [vacationStart, setVacationStart] = useState(() => inputDate(new Date()))
  const [vacationEnd, setVacationEnd] = useState(() => inputDate(addDays(new Date(), 3)))
  const [vacationOccasions, setVacationOccasions] = useState('casual, travel')
  const [vacationResult, setVacationResult] = useState<VacationResult | null>(null)

  const days = useMemo(() => viewDays(view, cursorDate), [view, cursorDate])
  const selectedDateObject = useMemo(() => dateFromInput(selectedDate), [selectedDate])
  const selectedDayPlans = useMemo(() => plans.filter((plan) => planDateKey(plan) === selectedDate), [plans, selectedDate])
  const todayPlans = useMemo(() => plans.filter((plan) => planDateKey(plan) === inputDate(new Date())), [plans])
  const stats = useMemo(() => ({
    planned: history.statusCounts.planned || plans.filter((plan) => plan.status === 'planned').length,
    worn: history.statusCounts.worn || plans.filter((plan) => plan.status === 'worn').length,
    skipped: history.statusCounts.skipped || plans.filter((plan) => plan.status === 'skipped').length
  }), [history.statusCounts, plans])

  async function loadCalendar() {
    setLoading(true)
    const from = inputDate(days[0])
    const to = inputDate(days[days.length - 1])
    try {
      const res = await fetch(`/api/calendar/outfits?from=${from}&to=${to}`)
      const data = await res.json()
      const next = Array.isArray(data) ? data : []
      setPlans(next)
      setDraftNotes(next.reduce<Record<string, string>>((acc, plan: CalendarPlan) => {
        acc[plan._id] = plan.notes || ''
        return acc
      }, {}))
      setDraftOccasions(next.reduce<Record<string, string>>((acc, plan: CalendarPlan) => {
        acc[plan._id] = plan.occasion || 'casual'
        return acc
      }, {}))
    } catch {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/calendar/history')
      const data = await res.json()
      setHistory({
        mostWorn: Array.isArray(data?.mostWorn) ? data.mostWorn : [],
        leastWorn: Array.isArray(data?.leastWorn) ? data.leastWorn : [],
        lastWorn: Array.isArray(data?.lastWorn) ? data.lastWorn : [],
        statusCounts: data?.statusCounts || {}
      })
    } catch {
      setHistory({ mostWorn: [], leastWorn: [], lastWorn: [], statusCounts: {} })
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadCalendar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursorDate])

  useEffect(() => {
    loadHistory()
  }, [])

  function navigate(delta: number) {
    setCursorDate((current) => {
      if (view === 'month') return addMonths(current, delta)
      if (view === 'week') return addDays(current, delta * 7)
      return addDays(current, delta)
    })
  }

  function chooseDate(day: Date) {
    const key = inputDate(day)
    setSelectedDate(key)
    setCursorDate(day)
  }

  function setToday() {
    const today = new Date()
    setCursorDate(today)
    setSelectedDate(inputDate(today))
  }

  async function generatePlan(replaceId?: string) {
    setBusyId(replaceId || 'generate')
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/calendar/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, occasion, notes, mode, replaceId })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not plan outfit')
      setNotice(replaceId ? 'Outfit regenerated for this day.' : 'Outfit planned.')
      setToast(replaceId ? 'Calendar outfit regenerated.' : 'Calendar outfit ready.')
      await loadCalendar()
      await loadHistory()
    } catch (e: any) {
      setError(e.message || 'Could not plan outfit')
    } finally {
      setBusyId('')
    }
  }

  async function patchPlan(plan: CalendarPlan, body: Partial<Pick<CalendarPlan, 'status' | 'notes' | 'occasion'>> & { date?: string }, message: string) {
    setBusyId(plan._id)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/calendar/outfits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan._id, ...body })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setNotice(message)
      await loadCalendar()
      if (body.status === 'worn') await loadHistory()
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setBusyId('')
    }
  }

  async function deletePlan(plan: CalendarPlan) {
    setBusyId(plan._id)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/calendar/outfits?id=${plan._id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Remove failed')
      setNotice('Removed from calendar.')
      await loadCalendar()
    } catch (e: any) {
      setError(e.message || 'Remove failed')
    } finally {
      setBusyId('')
    }
  }

  async function createPackingList() {
    setBusyId('vacation')
    setError('')
    setNotice('')
    setVacationResult(null)
    try {
      const res = await fetch('/api/calendar/vacation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: vacationDestination,
          startDate: vacationStart,
          endDate: vacationEnd,
          occasions: vacationOccasions
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not create packing list')
      setVacationResult(data)
      setToast('Packing list generated.')
    } catch (e: any) {
      setError(e.message || 'Could not create packing list')
    } finally {
      setBusyId('')
    }
  }

  function selectEmptyDay(day: Date) {
    chooseDate(day)
    setNotes('')
  }

  const selectedHeading = selectedDateObject.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <AppFrame
      title="AI outfit calendar"
      eyebrow="Daily planner"
      action={<Link href="/outfit-generator" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90">Generate now</Link>}
    >
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Planned', stats.planned, 'Looks ready'],
          ['Worn', stats.worn, 'Logged outfits'],
          ['Today', todayPlans.length, todayPlans[0] ? "Today's outfit ready" : 'No plan yet']
        ].map(([label, value, note]) => (
          <div key={label} className="glass rounded-[8px] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-[#d7ff55]">{note}</p>
          </div>
        ))}
      </section>

      <section className="glass mb-5 rounded-[8px] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Calendar controls</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button title="Previous month" type="button" onClick={() => navigate(-1)} className="icon-button h-11 w-11">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="min-w-0 px-1 text-2xl font-semibold tracking-tight sm:text-3xl">{rangeLabel(view, days, cursorDate)}</h2>
              <button title="Next month" type="button" onClick={() => navigate(1)} className="icon-button h-11 w-11">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[auto_170px_1fr] xl:min-w-[620px]">
            <div className="grid grid-cols-3 gap-1 rounded-[8px] border border-white/10 bg-black/24 p-1">
              {views.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={`h-10 rounded-[6px] px-3 text-sm capitalize transition ${view === item ? 'bg-[#d7ff55] text-black' : 'text-white/62 hover:bg-white/10 hover:text-white'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={setToday}
              className="flex h-12 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/8 px-4 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              <CalendarCheck className="h-4 w-4 text-[#d7ff55]" />
              Today
            </button>
            <label htmlFor="calendar-date-picker" className="block">
              <span className="sr-only">Choose date</span>
              <input
                id="calendar-date-picker"
                name="datePicker"
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value)
                  setCursorDate(dateFromInput(event.target.value))
                }}
                className="field h-12 py-0"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[150px_minmax(0,1fr)_150px_130px_auto]">
          <label htmlFor="calendar-plan-date" className="block">
            <span className="mb-1 block text-xs text-white/40">Plan date</span>
            <input
              id="calendar-plan-date"
              name="date"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value)
                setCursorDate(dateFromInput(event.target.value))
              }}
              className="field h-11 py-0"
            />
          </label>
          <label htmlFor="calendar-plan-notes" className="block">
            <span className="mb-1 block text-xs text-white/40">Notes</span>
            <input
              id="calendar-plan-notes"
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="field h-11"
              placeholder="Dress code, location, or outfit constraints"
            />
          </label>
          <label htmlFor="calendar-plan-occasion" className="block">
            <span className="mb-1 block text-xs text-white/40">Occasion</span>
            <select id="calendar-plan-occasion" name="occasion" value={occasion} onChange={(event) => setOccasion(event.target.value)} className="field h-11 py-0 capitalize">
              {occasions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label htmlFor="calendar-plan-mode" className="block">
            <span className="mb-1 block text-xs text-white/40">Mode</span>
            <select id="calendar-plan-mode" name="mode" value={mode} onChange={(event) => setMode(event.target.value as 'basic' | 'hybrid')} className="field h-11 py-0">
              <option value="basic">Local</option>
              <option value="hybrid">Hybrid AI</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => generatePlan()}
            disabled={busyId === 'generate'}
            className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60 xl:mt-5"
          >
            {busyId === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Generate Outfit
          </button>
        </div>
      </section>

      {error && <p className="mb-4 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      {notice && <p className="mb-4 rounded-[8px] border border-[#d7ff55]/25 bg-[#d7ff55]/10 p-3 text-sm text-[#efffbd]">{notice}</p>}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0">
          {loading ? (
            <div className="grid gap-3 lg:grid-cols-7">
              {Array.from({ length: view === 'day' ? 1 : view === 'week' ? 7 : 42 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-[8px] bg-white/7" />)}
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                {view !== 'day' ? (
                  <div className="mb-2 grid grid-cols-7 gap-2 px-1">
                    {weekDays.map((day) => (
                      <div key={day} className="py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/38">{day}</div>
                    ))}
                  </div>
                ) : null}

                {view === 'month' ? (
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day) => {
                      const key = inputDate(day)
                      const plansForDay = dayPlans(plans, day)
                      const featuredPlan = plansForDay[0]
                      const isToday = key === inputDate(new Date())
                      const isSelected = key === selectedDate
                      const outsideMonth = day.getMonth() !== cursorDate.getMonth()
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => chooseDate(day)}
                          className={`min-h-[158px] rounded-[8px] border p-2 text-left transition hover:-translate-y-0.5 hover:border-[#d7ff55]/45 ${isSelected ? 'border-[#d7ff55]/70 bg-[#d7ff55]/10' : 'border-white/10 bg-white/[0.04]'} ${outsideMonth ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`grid h-8 w-8 place-items-center rounded-[8px] text-sm font-black ${isToday ? 'bg-[#d7ff55] text-black' : 'bg-white/10 text-white'}`}>{day.getDate()}</span>
                            <CloudSun className="h-4 w-4 text-[#d7ff55]/80" />
                          </div>
                          {featuredPlan ? (
                            <div className="mt-3">
                              <PlanImages outfit={featuredPlan.outfitId} />
                              <p className="mt-2 truncate text-xs font-semibold capitalize text-white">{featuredPlan.outfitId?.title || `${featuredPlan.occasion} outfit`}</p>
                              <p className="mt-1 truncate text-[11px] capitalize text-white/46">{featuredPlan.occasion} / {shortWeather(featuredPlan.weather)}</p>
                            </div>
                          ) : (
                            <div className="mt-3 flex min-h-[92px] items-center justify-center rounded-[8px] border border-dashed border-white/10 text-xs text-white/28">Open day</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {view === 'week' ? (
                  <div className="grid grid-cols-7 gap-3">
                    {days.map((day) => {
                      const key = inputDate(day)
                      const plansForDay = dayPlans(plans, day)
                      const featuredPlan = plansForDay[0]
                      const isSelected = key === selectedDate
                      return (
                        <article key={key} className={`min-h-[330px] rounded-[8px] border p-3 ${isSelected ? 'border-[#d7ff55]/70 bg-[#d7ff55]/10' : 'border-white/10 bg-white/[0.04]'}`}>
                          <button type="button" onClick={() => chooseDate(day)} className="flex w-full items-start justify-between text-left">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-white/35">{day.toLocaleDateString('en', { weekday: 'short' })}</p>
                              <p className="mt-1 text-2xl font-semibold">{day.getDate()}</p>
                            </div>
                            <CalendarDays className="h-4 w-4 text-white/35" />
                          </button>
                          <div className="mt-4">
                            {featuredPlan ? (
                              <div className="rounded-[8px] border border-white/8 bg-black/22 p-2.5">
                                <PlanImages outfit={featuredPlan.outfitId} />
                                <p className="mt-3 line-clamp-2 text-sm font-semibold capitalize">{featuredPlan.outfitId?.title || `${featuredPlan.occasion} outfit`}</p>
                                <div className="mt-3 grid gap-2 text-xs text-white/52">
                                  <span className="inline-flex items-center justify-between rounded-[8px] bg-white/8 px-2 py-1.5">
                                    Confidence <strong className="text-[#d7ff55]">{confidenceScore(featuredPlan)}%</strong>
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-white/8 px-2 py-1.5 capitalize">
                                    <CloudSun className="h-3.5 w-3.5 text-[#d7ff55]" />
                                    {shortWeather(featuredPlan.weather)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <EmptyDayButton dateKey={key} onClick={() => selectEmptyDay(day)} />
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : null}

                {view === 'day' ? (
                  <div className="grid gap-4">
                    {(selectedDayPlans.length ? selectedDayPlans : [null]).map((plan, index) => plan ? (
                      <article key={plan._id} className="glass rounded-[8px] p-5">
                        <PlanImages outfit={plan.outfitId} large />
                        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_260px]">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-white/35">{plan.occasion}</p>
                            <h2 className="mt-2 text-3xl font-semibold capitalize">{plan.outfitId?.title || `${plan.occasion} outfit`}</h2>
                            <p className="mt-3 text-sm leading-6 text-white/58">{plan.outfitId?.explanation || plan.weather?.suggestion || 'AI explanation will appear after this outfit is generated.'}</p>
                          </div>
                          <div className="grid gap-2">
                            <div className="rounded-[8px] bg-white/8 p-3">
                              <p className="text-xs text-white/40">Confidence</p>
                              <p className="mt-1 text-2xl font-semibold text-[#d7ff55]">{confidenceScore(plan)}%</p>
                            </div>
                            <div className="rounded-[8px] bg-white/8 p-3">
                              <p className="text-xs text-white/40">Weather</p>
                              <p className="mt-1 text-sm capitalize text-white/75">{shortWeather(plan.weather)}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    ) : (
                      <div key={`empty-${index}`} className="glass rounded-[8px] p-10 text-center">
                        <Sparkles className="mx-auto h-8 w-8 text-[#d7ff55]" />
                        <h2 className="mt-4 text-xl font-semibold">No outfit planned for {selectedHeading}</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">Pick an occasion and generate a weather-aware outfit for this day.</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 lg:hidden">
                {days.map((day) => {
                  const key = inputDate(day)
                  const plansForDay = dayPlans(plans, day)
                  return (
                    <article key={key} className={`rounded-[8px] border p-3 ${key === selectedDate ? 'border-[#d7ff55]/70 bg-[#d7ff55]/10' : 'border-white/10 bg-white/[0.045]'}`}>
                      <button type="button" onClick={() => chooseDate(day)} className="flex w-full items-center justify-between gap-3 text-left">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-white text-lg font-black text-black">{day.getDate()}</span>
                          <div className="min-w-0">
                            <p className="font-semibold">{day.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-white/42">{plansForDay.length ? `${plansForDay.length} planned` : 'No outfit planned'}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
                      </button>
                      <div className="mt-3 grid gap-2">
                        {plansForDay.length ? plansForDay.slice(0, 2).map((plan) => (
                          <div key={plan._id} className="rounded-[8px] border border-white/8 bg-black/22 p-2.5">
                            <PlanImages outfit={plan.outfitId} />
                            <p className="mt-2 truncate text-sm font-semibold capitalize">{plan.outfitId?.title || `${plan.occasion} outfit`}</p>
                            <p className="mt-1 text-xs capitalize text-white/46">{plan.occasion} / {shortWeather(plan.weather)}</p>
                          </div>
                        )) : (
                          <EmptyDayButton dateKey={key} onClick={() => selectEmptyDay(day)} />
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-5 lg:self-start">
          <section className="glass rounded-[8px] p-4">
            <div className="flex items-center gap-2">
              <ClockIcon />
              <h2 className="font-semibold">Selected day</h2>
            </div>
            <p className="mt-2 text-sm text-white/45">{selectedDateObject.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <div className="mt-4 grid gap-3">
              {selectedDayPlans.length ? selectedDayPlans.map((plan) => (
                <article key={plan._id} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                  <PlanImages outfit={plan.outfitId} />
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{plan.occasion}</p>
                      <h3 className="mt-1 font-semibold capitalize">{plan.outfitId?.title || `${plan.occasion} outfit`}</h3>
                    </div>
                    <span className="rounded-[8px] bg-white px-2.5 py-1 text-sm font-bold text-black">{confidenceScore(plan)}%</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-[8px] bg-white/8 px-2.5 py-2 capitalize text-white/64">{shortWeather(plan.weather)}</span>
                    <span className={`rounded-[8px] px-2.5 py-2 text-center capitalize ${statusTone(plan.status)}`}>{plan.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/52">{plan.outfitId?.explanation || plan.weather?.suggestion || 'Weather and rotation checked for this day.'}</p>

                  <div className="mt-3 grid gap-3">
                    <label htmlFor={`calendar-occasion-${plan._id}`} className="block">
                      <span className="mb-1 block text-xs text-white/40">Occasion</span>
                      <select
                        id={`calendar-occasion-${plan._id}`}
                        name={`occasion-${plan._id}`}
                        value={draftOccasions[plan._id] || plan.occasion}
                        onChange={(event) => setDraftOccasions((current) => ({ ...current, [plan._id]: event.target.value }))}
                        className="field h-10 py-0 capitalize"
                      >
                        {occasions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label htmlFor={`calendar-notes-${plan._id}`} className="block">
                      <span className="mb-1 block text-xs text-white/40">Notes</span>
                      <textarea
                        id={`calendar-notes-${plan._id}`}
                        name={`notes-${plan._id}`}
                        value={draftNotes[plan._id] || ''}
                        onChange={(event) => setDraftNotes((current) => ({ ...current, [plan._id]: event.target.value }))}
                        rows={2}
                        className="field min-h-[72px] resize-none"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => patchPlan(plan, { notes: draftNotes[plan._id] || '', occasion: draftOccasions[plan._id] || plan.occasion }, 'Plan edited.')} disabled={busyId === plan._id} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 text-sm text-white/70 transition hover:bg-white/8 disabled:opacity-50">
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button type="button" onClick={() => patchPlan(plan, { notes: draftNotes[plan._id] || '' }, 'Notes saved.')} disabled={busyId === plan._id} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 text-sm text-white/70 transition hover:bg-white/8 disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                      <button type="button" onClick={() => {
                        setOccasion(draftOccasions[plan._id] || plan.occasion)
                        setNotes(draftNotes[plan._id] || plan.notes || '')
                        generatePlan(plan._id)
                      }} disabled={busyId === plan._id} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black disabled:opacity-60">
                        {busyId === plan._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Regenerate
                      </button>
                      <button type="button" onClick={() => patchPlan(plan, { status: 'worn' }, 'Marked as worn.')} disabled={busyId === plan._id} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] text-sm font-semibold text-black disabled:opacity-60">
                        <CheckCircle2 className="h-4 w-4" />
                        Mark Worn
                      </button>
                      <button type="button" onClick={() => deletePlan(plan)} disabled={busyId === plan._id} className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-[8px] border border-red-400/20 text-sm text-red-100 transition hover:bg-red-400/15 disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="rounded-[8px] border border-dashed border-white/12 p-5 text-center">
                  <Sparkles className="mx-auto h-7 w-7 text-white/35" />
                  <p className="mt-3 text-sm text-white/45">No outfit planned for this day.</p>
                </div>
              )}
            </div>
          </section>

          <section className="glass rounded-[8px] p-4">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-[#d7ff55]" />
              <h2 className="font-semibold">Vacation mode</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <label htmlFor="calendar-vacation-destination" className="block">
                <span className="mb-1 block text-xs text-white/40">Destination</span>
                <input id="calendar-vacation-destination" name="destination" type="text" autoComplete="address-level2" value={vacationDestination} onChange={(event) => setVacationDestination(event.target.value)} className="field h-11" placeholder="Goa, Dubai, London" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label htmlFor="calendar-vacation-start" className="block">
                  <span className="mb-1 block text-xs text-white/40">Start</span>
                  <input id="calendar-vacation-start" name="startDate" type="date" value={vacationStart} onChange={(event) => setVacationStart(event.target.value)} className="field h-11 py-0" />
                </label>
                <label htmlFor="calendar-vacation-end" className="block">
                  <span className="mb-1 block text-xs text-white/40">End</span>
                  <input id="calendar-vacation-end" name="endDate" type="date" value={vacationEnd} onChange={(event) => setVacationEnd(event.target.value)} className="field h-11 py-0" />
                </label>
              </div>
              <label htmlFor="calendar-vacation-occasions" className="block">
                <span className="mb-1 block text-xs text-white/40">Occasions</span>
                <input id="calendar-vacation-occasions" name="vacationOccasions" type="text" autoComplete="off" value={vacationOccasions} onChange={(event) => setVacationOccasions(event.target.value)} className="field h-11" />
              </label>
              <button type="button" onClick={createPackingList} disabled={busyId === 'vacation'} className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-semibold text-black disabled:opacity-60">
                {busyId === 'vacation' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                Generate Packing List
              </button>
            </div>

            {vacationResult ? (
              <div className="mt-4 rounded-[8px] border border-white/10 bg-black/22 p-3">
                <p className="text-sm font-semibold capitalize">{vacationResult.destination} / {vacationResult.days} days</p>
                <p className="mt-1 text-xs capitalize text-white/42">{shortWeather(vacationResult.weather)}</p>
                <div className="mt-3 grid gap-2">
                  {vacationResult.packingList.map((entry) => (
                    <div key={entry.item} className="rounded-[8px] bg-white/7 p-2">
                      <p className="text-sm font-medium capitalize">{entry.quantity} {entry.item}</p>
                      <p className="mt-1 text-xs leading-5 text-white/45">{entry.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="glass rounded-[8px] p-4">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-[#d7ff55]" />
              <h2 className="font-semibold">Outfit history</h2>
            </div>
            {historyLoading ? (
              <div className="mt-4 grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-[8px] bg-white/7" />)}
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                <HistoryList title="Most worn" items={history.mostWorn} />
                <HistoryList title="Least worn" items={history.leastWorn} />
                <HistoryList title="Last worn" items={history.lastWorn} />
              </div>
            )}
          </section>
        </aside>
      </section>

      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}
    </AppFrame>
  )
}

function ClockIcon() {
  return <CalendarDays className="h-5 w-5 text-[#d7ff55]" />
}
