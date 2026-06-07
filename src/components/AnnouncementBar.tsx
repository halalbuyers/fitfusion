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

  const activeAnnouncement = visibleAnnouncements[activeIndex % Math.max(1, visibleAnnouncements.length)]
  const marqueeItems = [...visibleAnnouncements, ...visibleAnnouncements, ...visibleAnnouncements]
  const duration = Math.max(22, visibleAnnouncements.length * 12)

  if (isDismissed || !visibleAnnouncements.length) return null

  return (
    <AnimatePresence>
      <div className="h-[var(--announcement-offset)]" aria-hidden="true" />
      <MotionDiv
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        className="fixed inset-x-0 top-0 z-[70] border-b border-white/10 bg-[#090a0e]/82 text-white shadow-2xl shadow-black/30 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d9ff5a]/35 bg-[#d9ff5a]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d9ff5a] shadow-[0_0_28px_rgba(217,255,90,0.12)]">
                <Sparkles className="h-3.5 w-3.5" /> Community Powered
              </span>
              <div className="min-w-0 flex-1 text-sm leading-6 text-white/75">
                <AnimatePresence mode="wait">
                  <MotionDiv
                    key={activeAnnouncement?._id || 'static'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="flex min-w-0 flex-wrap items-center gap-2"
                  >
                    {activeAnnouncement ? (
                      <>
                        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                          {(() => {
                            const ActiveIcon = typeMeta[activeAnnouncement.type]?.icon || Sparkles
                            return <ActiveIcon className="h-3 w-3 text-[#d9ff5a]" />
                          })()}
                          {typeMeta[activeAnnouncement.type]?.label || 'Update'}
                        </span>
                        <Link href={`/admin/announcements#${activeAnnouncement._id}`} className="min-w-0 font-medium text-white hover:text-[#d9ff5a]">
                          {activeAnnouncement.title}
                        </Link>
                        <span className="hidden text-white/60 md:inline">-</span>
                        <span className="hidden truncate text-white/60 md:inline">{activeAnnouncement.description || activeAnnouncement.body}</span>
                        {activeAnnouncement.suggestedByUsername ? (
                          <span className="hidden rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60 md:inline">
                            Thanks @{activeAnnouncement.suggestedByUsername}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span>Latest FitFusion experience updates and feature launches.</span>
                    )}
                  </MotionDiv>
                </AnimatePresence>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem(STORAGE_KEY, visibleAnnouncements.map((item) => item._id).join('|'))
                  setIsDismissed(true)
                }}
                className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2.5 text-sm text-white/80 transition hover:border-[#d9ff5a]/40 hover:text-[#d9ff5a] sm:px-3"
                title="Dismiss announcements"
                aria-label="Dismiss announcements"
              >
                <X className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Dismiss</span>
              </button>
              <Link href="/admin/announcements" className="inline-flex h-9 items-center gap-2 rounded-full bg-[#d9ff5a] px-3 text-sm font-semibold text-black transition hover:bg-[#e7ff8f]">
                View updates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div
            className="relative overflow-hidden rounded-[8px] border border-white/5 bg-white/5 py-2.5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#090a0e] to-transparent sm:w-16" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#090a0e] to-transparent sm:w-16" />
            <div
              className="marquee flex min-w-max items-center gap-5 whitespace-nowrap px-4 text-sm text-white/80"
              style={{ animationPlayState: isPaused ? 'paused' : 'running', animationDuration: `${duration}s` }}
            >
              {marqueeItems.map((announcement, index) => {
                const meta = typeMeta[announcement.type] || typeMeta.update
                return (
                  <Link
                    key={`${announcement._id}-${index}`}
                    href={`/admin/announcements#${announcement._id}`}
                    className="inline-flex min-w-max items-center gap-3 rounded-full border border-white/10 bg-[#0f1219]/90 px-4 py-2 text-white/75 transition hover:border-[#d9ff5a]/30 hover:text-white"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#d9ff5a]/10 text-[#d9ff5a]">
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-white">{announcement.title}</span>
                    <span className="text-white/50">-</span>
                    <span className="max-w-[55vw] truncate text-white/55 sm:max-w-none">{announcement.description || announcement.body}</span>
                    {announcement.suggestedByUsername ? <span className="text-[#d9ff5a]/80">@{announcement.suggestedByUsername}</span> : null}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </MotionDiv>
    </AnimatePresence>
  )
}
