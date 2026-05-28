"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Outfit = { _id: string; title: string; score: number; plannedFor?: string; occasion?: string }

function startOfWeek(date: Date) {
  const next = new Date(date)
  const day = (next.getDay() + 6) % 7
  next.setDate(next.getDate() - day)
  next.setHours(0, 0, 0, 0)
  return next
}

export default function CalendarPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const week = useMemo(() => {
    const start = startOfWeek(new Date())
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [])

  useEffect(() => {
    const from = week[0].toISOString()
    const to = week[6].toISOString()
    fetch(`/api/saved-outfits?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data) => setOutfits(Array.isArray(data) ? data : []))
      .catch(() => setOutfits([]))
  }, [week])

  return (
    <AppFrame title="Outfit calendar" eyebrow="Weekly planner" action={<Link href="/outfits" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black">Saved outfits</Link>}>
      <div className="grid gap-3 md:grid-cols-7">
        {week.map((date) => {
          const iso = date.toISOString().slice(0, 10)
          const dayOutfits = outfits.filter((outfit) => outfit.plannedFor?.slice(0, 10) === iso)
          return (
            <div key={iso} className="min-h-[240px] rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{date.toLocaleDateString('en', { weekday: 'short' })}</h2>
                  <p className="text-xs text-white/40">{date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                </div>
                <CalendarDays className="h-4 w-4 text-white/35" />
              </div>
              <div className="mt-4 grid gap-2">
                {dayOutfits.length ? dayOutfits.map((outfit) => (
                  <div key={outfit._id} className="rounded-[8px] bg-white/8 p-3">
                    <p className="text-sm font-medium">{outfit.title}</p>
                    <p className="mt-1 text-xs text-white/45">{outfit.occasion} / {outfit.score}</p>
                  </div>
                )) : (
                  <Link href="/outfit-generator" className="flex min-h-[120px] items-center justify-center rounded-[8px] border border-dashed border-white/12 text-white/35 transition hover:border-white/30 hover:text-white/65">
                    <Plus className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AppFrame>
  )
}
