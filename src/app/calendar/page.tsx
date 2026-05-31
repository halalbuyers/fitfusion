"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, X } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Outfit = { _id: string; title: string; score: number; plannedFor?: string | null; occasion?: string }

function startOfWeek(date: Date) {
  const next = new Date(date)
  const day = (next.getDay() + 6) % 7
  next.setDate(next.getDate() - day)
  next.setHours(0, 0, 0, 0)
  return next
}

function inputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalendarPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedOutfit, setSelectedOutfit] = useState('')
  const [selectedDate, setSelectedDate] = useState(inputDate(new Date()))
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const week = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    const start = startOfWeek(base)
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [weekOffset])

  async function loadCalendar() {
    setLoading(true)
    const fromDate = new Date(week[0])
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(week[6])
    toDate.setHours(23, 59, 59, 999)
    try {
      const [weekRes, savedRes] = await Promise.all([
        fetch(`/api/saved-outfits?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`),
        fetch('/api/outfits')
      ])
      const [weekData, savedData] = await Promise.all([weekRes.json(), savedRes.json()])
      setOutfits(Array.isArray(weekData) ? weekData : [])
      const allSaved = Array.isArray(savedData) ? savedData : []
      setSavedOutfits(allSaved)
      if (!selectedOutfit && allSaved[0]?._id) setSelectedOutfit(allSaved[0]._id)
    } catch {
      setOutfits([])
      setSavedOutfits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  async function patchOutfit(id: string, body: Partial<Outfit>, message: string) {
    setBusyId(id)
    setNotice('')
    setError('')
    try {
      const res = await fetch(`/api/outfits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setNotice(message)
      await loadCalendar()
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setBusyId('')
    }
  }

  async function removeOutfit(id: string) {
    setBusyId(id)
    setNotice('')
    setError('')
    try {
      const res = await fetch(`/api/outfits/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Remove failed')
      setNotice('Outfit deleted.')
      await loadCalendar()
    } catch (e: any) {
      setError(e.message || 'Remove failed')
    } finally {
      setBusyId('')
    }
  }

  async function addToCalendar() {
    if (!selectedOutfit) {
      setError('Choose a saved outfit first.')
      return
    }
    await patchOutfit(selectedOutfit, { plannedFor: `${selectedDate}T12:00:00` }, 'Added to calendar.')
  }

  return (
    <AppFrame title="Outfit calendar" eyebrow="Weekly planner" action={<Link href="/outfits" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black">Saved outfits</Link>}>
      <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="glass rounded-[8px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">Week</p>
              <h2 className="mt-1 font-semibold">{week[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} - {week[6].toLocaleDateString('en', { month: 'short', day: 'numeric' })}</h2>
            </div>
            <div className="flex gap-2">
              <button title="Previous week" onClick={() => setWeekOffset((value) => value - 1)} className="icon-button h-10 w-10"><ChevronLeft className="h-4 w-4" /></button>
              <button title="Next week" onClick={() => setWeekOffset((value) => value + 1)} className="icon-button h-10 w-10"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="glass rounded-[8px] p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/35">Plan saved outfit</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
            <select value={selectedOutfit} onChange={(e) => setSelectedOutfit(e.target.value)} className="field h-11">
              {savedOutfits.length ? savedOutfits.map((outfit) => <option key={outfit._id} value={outfit._id}>{outfit.title}</option>) : <option value="">No saved outfits</option>}
            </select>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="field h-11 py-0" />
            <button onClick={addToCalendar} disabled={busyId === selectedOutfit || !selectedOutfit} className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-4 text-sm font-semibold text-black disabled:opacity-50">
              {busyId === selectedOutfit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
        </div>
      </section>

      {error && <p className="mb-4 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      {notice && <p className="mb-4 rounded-[8px] border border-[#d7ff55]/25 bg-[#d7ff55]/10 p-3 text-sm text-[#efffbd]">{notice}</p>}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {week.map((date) => {
            const iso = inputDate(date)
            const dayOutfits = outfits.filter((outfit) => outfit.plannedFor && inputDate(new Date(outfit.plannedFor)) === iso)
            const isToday = iso === inputDate(new Date())
            return (
              <div key={iso} className={`min-h-[260px] rounded-[8px] border p-3 ${isToday ? 'border-[#d7ff55]/60 bg-[#d7ff55]/10' : 'border-white/10 bg-white/[0.035]'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-[8px] text-xl font-black ${isToday ? 'bg-[#d7ff55] text-black' : 'bg-white text-black'}`}>
                      {date.getDate()}
                    </div>
                    <div>
                      <h2 className="font-semibold">{date.toLocaleDateString('en', { weekday: 'short' })}</h2>
                      <p className="text-xs text-white/45">{date.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <CalendarDays className="h-4 w-4 text-white/35" />
                </div>
                <div className="mt-4 grid gap-2">
                  {dayOutfits.length ? dayOutfits.map((outfit) => (
                    <div key={outfit._id} className="rounded-[8px] bg-white/8 p-3">
                      <p className="text-sm font-medium">{outfit.title}</p>
                      <p className="mt-1 text-xs text-white/45">{outfit.occasion} / {outfit.score}</p>
                      <div className="mt-3 flex gap-2">
                        <button title="Unplan" onClick={() => patchOutfit(outfit._id, { plannedFor: null }, 'Removed from calendar.')} className="icon-button h-8 w-8">
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button title="Delete" onClick={() => removeOutfit(outfit._id)} className="icon-button h-8 w-8 text-red-100 hover:bg-red-400/15">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <button onClick={() => setSelectedDate(iso)} className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-white/12 text-white/35 transition hover:border-white/30 hover:text-white/65">
                      <Plus className="h-5 w-5" />
                      <span className="text-xs">Plan {iso}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppFrame>
  )
}
