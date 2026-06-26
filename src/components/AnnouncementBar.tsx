'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Announcement = {
  _id: string
  title: string
  body: string
  description?: string
  type: 'update' | 'feature' | 'fix' | 'announcement' | 'maintenance' | 'bug_fix' | 'community' | 'improvement' | 'security'
  isActive?: boolean
  featured?: boolean
  pinned?: boolean
  priority?: number
  displayOrder?: number
  suggestedByUsername?: string
  creditedUsername?: string
}

const STORAGE_KEY = 'noircloset-announcements-dismissed-feed'

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
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
            const pinnedA = a.pinned ? 1 : 0
            const pinnedB = b.pinned ? 1 : 0
            if (pinnedA !== pinnedB) return pinnedB - pinnedA
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

  const duration = Math.min(
    40,
    Math.max(
      20,
      visibleAnnouncements.reduce((sum, item) => sum + item.title.length + (item.description || item.body || '').length, 0) / 9
    )
  )
  const marqueeStyle = { '--announcement-marquee-duration': `${duration}s` } as React.CSSProperties

  if (isDismissed || !visibleAnnouncements.length) return null

  const renderTrack = (copy = false) => (
    <div className="announcement-marquee__group" aria-hidden={copy}>
      {visibleAnnouncements.map((announcement) => (
        <span key={`${copy ? 'copy' : 'main'}-${announcement._id}`} className="announcement-marquee__item">
          <span className="font-semibold text-white">{announcement.title}</span>
          <span className="text-white/45">&bull;</span>
          <span className="max-w-[44vw] truncate text-white/60 md:max-w-[28rem]">{announcement.description || announcement.body}</span>
          {announcement.creditedUsername || announcement.suggestedByUsername ? (
            <span className="hidden text-[#d9ff5a]/80 md:inline">Thanks @{announcement.creditedUsername || announcement.suggestedByUsername}</span>
          ) : null}
        </span>
      ))}
    </div>
  )

  return (
    <div className="sticky top-[var(--navbar-height)] z-40 h-10 border-t border-white/10 border-b border-white/10 bg-[#090a0e]/92 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-3 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 whitespace-nowrap text-sm text-white/75">
          <span className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#d9ff5a]/25 bg-[#d9ff5a]/10 px-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d9ff5a]">
            <Sparkles className="h-3.5 w-3.5" />
            Updates
          </span>
          <div className="announcement-marquee" style={marqueeStyle}>
            <div className="announcement-marquee__track">
              {renderTrack()}
              {renderTrack(true)}
            </div>
          </div>
        </div>

        <Link href="/updates" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#d9ff5a] px-3 text-sm font-semibold text-black transition hover:bg-[#e7ff8f]">
          View updates
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
