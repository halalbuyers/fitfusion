"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, BadgeCheck, CalendarDays, Heart, Mail, MessageSquare, Shirt, Sparkles, UserRound } from 'lucide-react'

type ProfilePayload = {
  user?: {
    userId: string
    databaseId?: string
    username: string
    name?: string
    email?: string
    avatar?: string
    role?: string
    joinedAt?: string
    lastActiveAt?: string
  }
  stats?: {
    feedbackSubmitted: number
    acceptedFeedback: number
    postsCreated: number
    likesReceived: number
    outfitsGenerated: number
    wardrobeItems: number
  }
  error?: string
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function initials(value?: string) {
  const parts = String(value || 'FitFusion').trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || 'F') + (parts[1]?.[0] || parts[0]?.[1] || 'F')).toUpperCase()
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass rounded-[8px] p-4 ${className}`}>{children}</section>
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/48">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/8">
          <Icon className="h-5 w-5 text-[#d7ff55]" />
        </div>
      </div>
    </Card>
  )
}

export function UserProfileAdmin({ userId }: { userId: string }) {
  const [payload, setPayload] = useState<ProfilePayload>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/users/${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => setPayload(data || {}))
      .catch(() => setPayload({ error: 'Could not load user profile' }))
      .finally(() => setLoading(false))
  }, [userId])

  const user = payload.user
  const stats = payload.stats || {
    feedbackSubmitted: 0,
    acceptedFeedback: 0,
    postsCreated: 0,
    likesReceived: 0,
    outfitsGenerated: 0,
    wardrobeItems: 0
  }

  return (
    <div className="premium-grid min-h-screen bg-[#070707] px-3 py-4 text-white sm:px-5 lg:px-8">
      <main className="mx-auto grid max-w-6xl gap-5">
        <Link href="/admin/users" className="inline-flex w-fit items-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>

        {loading ? (
          <Card><div className="h-40 animate-pulse rounded-[8px] bg-white/8" /></Card>
        ) : payload.error ? (
          <Card><p className="text-sm text-red-200">{payload.error}</p></Card>
        ) : (
          <>
            <Card>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="h-20 w-20 rounded-full object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-xl font-semibold ring-1 ring-white/10">{initials(user?.username)}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Admin User Profile</p>
                    <h1 className="mt-2 truncate text-3xl font-semibold">@{user?.username || userId}</h1>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/52">
                      <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-[#d7ff55]" /> {user?.userId || userId}</span>
                      <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-[#d7ff55]" /> {user?.email || 'No email stored'}</span>
                      <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#d7ff55]" /> Joined {formatDate(user?.joinedAt)}</span>
                    </div>
                  </div>
                </div>
                <span className="w-fit rounded-full bg-white/8 px-3 py-2 text-sm capitalize text-white/70">{user?.role || 'user'}</span>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Feedback Submitted" value={stats.feedbackSubmitted} icon={MessageSquare} />
              <StatCard label="Accepted Feedback" value={stats.acceptedFeedback} icon={BadgeCheck} />
              <StatCard label="Posts Created" value={stats.postsCreated} icon={Sparkles} />
              <StatCard label="Likes Received" value={stats.likesReceived} icon={Heart} />
              <StatCard label="Outfits Generated" value={stats.outfitsGenerated} icon={Shirt} />
              <StatCard label="Wardrobe Items" value={stats.wardrobeItems} icon={UserRound} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
