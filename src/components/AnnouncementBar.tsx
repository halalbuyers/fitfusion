'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Bell, Sparkles, Star, X, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Announcement = {
  _id: string
  title: string
  body: string
  description?: string
  type: 'update' | 'feature' | 'fix' | 'announcement' | 'maintenance'
  isActive?: boolean
  featured?: boolean
  priority?: number
  displayOrder?: number
  suggestedByUsername?: string
}

const STORAGE_KEY = 'fitfusion-announcements-dismissed-feed'

const typeMeta: Record<string, { label: string; icon: typeof Star }> = {
  update: { label: 'Update', icon: Zap },
  feature: { label: 'Feature', icon: Star },
  fix: { label: 'Fix', icon: Bell },
  announcement: { label: 'News', icon: Bell },
  maintenance: { label: 'Notice', icon: Bell }
}

const MotionDiv = motion.div as any

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    let active = true

    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        const payload = Array.isArray(data.announcements) ? data.announcements : []
        const items = payload
          .filter((item: Announcement) => item.isActive !== false)
          .sort((a: Announcement, b: Announcement) => {
            const featureA = a.featured ? 1 : 0
            const featureB = b.featured ? 1 : 0
            if (featureA !== featureB) return featureB - featureA
            const orderA = Number(a.displayOrder || 0)
            const orderB = Number(b.displayOrder || 0)
            if (orderA !== orderB) return orderA - orderB
            return Number(b.priority || 0) - Number(a.priority || 0)
          })
        setAnnouncements(items)
      })
      .catch(() => setAnnouncements([]))

    return () => {
      active = false
    }
  }, [])

  const visibleAnnouncements = useMemo(() => {
    return announcements.filter((item) => item.isActive !== false)
  }, [announcements])

  useEffect(() => {
    if (!visibleAnnouncements.length) return
    const feedKey = visibleAnnouncements.map((item) => item._id).join('|')
    setIsDismissed(window.localStorage.getItem(STORAGE_KEY) === feedKey)
  }, [visibleAnnouncements])

  useEffect(() => {
    if (!visibleAnnouncements.length || isDismissed || isPaused) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleAnnouncements.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [visibleAnnouncements, isDismissed, isPaused])

  const marqueeItems = [...visibleAnnouncements, ...visibleAnnouncements]
  const duration = Math.max(20, visibleAnnouncements.length * 10)

  if (isDismissed || !visibleAnnouncements.length) return null

  return (
    <AnimatePresence>
      <MotionDiv
        key="announcement-bar"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="sticky top-[var(--navbar-height)] z-40 border-t border-white/10 border-b border-white/10 bg-[#090a0e]/92 text-white backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 h-10 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overflow-y-hidden whitespace-nowrap text-sm text-white/75 hide-scrollbar" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}>
            <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-[#d9ff5a]/25 bg-[#d9ff5a]/10 px-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d9ff5a]">
              <Sparkles className="h-3.5 w-3.5" />
              Updates
            </span>
            <div className="inline-flex min-w-full items-center gap-6">
              {marqueeItems.map((announcement, index) => (
                <span key={`${announcement._id}-${index}`} className="inline-flex min-w-max items-center gap-2">
                  <span className="font-semibold text-white">{announcement.title}</span>
                  <span className="hidden text-white/50 md:inline">·</span>
                  <span className="max-w-[40vw] truncate text-white/60 md:max-w-[60vw]">{announcement.description || announcement.body}</span>
                  {announcement.suggestedByUsername ? <span className="hidden text-[#d9ff5a]/80 md:inline">Thanks @{announcement.suggestedByUsername}</span> : null}
                </span>
              ))}
            </div>
          </div>

          <Link href="/updates" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#d9ff5a] px-3 text-sm font-semibold text-black transition hover:bg-[#e7ff8f]">
            View updates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </MotionDiv>
    </AnimatePresence>
  )
}
