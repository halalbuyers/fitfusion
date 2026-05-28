"use client"

import { useEffect, useState } from 'react'
import { Activity, Database, Shirt, Sparkles, Users } from 'lucide-react'
import { AppFrame, MetricCard } from '../../components/AppFrame'

type AdminStats = {
  users: number
  clothing: number
  outfits: number
  posts: number
  health: string
  recentUsers: Array<{ _id: string; name: string; email: string; createdAt?: string }>
  recentOutfits: Array<{ _id: string; title: string; score: number; createdAt?: string }>
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppFrame title="Admin operations" eyebrow="Users, wardrobe, system health">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Users" value={loading ? '...' : String(stats?.users || 0)} note="Mongo profiles" />
        <MetricCard label="Clothing" value={loading ? '...' : String(stats?.clothing || 0)} note="Uploaded wardrobe items" />
        <MetricCard label="Outfits" value={loading ? '...' : String(stats?.outfits || 0)} note="Generated or saved fits" />
        <MetricCard label="Posts" value={loading ? '...' : String(stats?.posts || 0)} note="Community content" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-[#d7ff55]" />
            <h2 className="font-semibold">System status</h2>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-white/55">
            <div className="flex items-center justify-between rounded-[8px] bg-white/7 px-3 py-3">
              <span className="flex items-center gap-2"><Database className="h-4 w-4" /> Database</span>
              <span>{stats?.health || 'checking'}</span>
            </div>
            <div className="flex items-center justify-between rounded-[8px] bg-white/7 px-3 py-3">
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Outfit engine</span>
              <span>local-first</span>
            </div>
            <div className="flex items-center justify-between rounded-[8px] bg-white/7 px-3 py-3">
              <span className="flex items-center gap-2"><Shirt className="h-4 w-4" /> Upload fallback</span>
              <span>enabled</span>
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-white/70" />
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {(stats?.recentUsers || []).map((user) => (
              <div key={user._id} className="rounded-[8px] border border-white/10 bg-black/20 p-3 text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="mt-1 text-white/42">{user.email}</p>
              </div>
            ))}
            {(stats?.recentOutfits || []).map((outfit) => (
              <div key={outfit._id} className="rounded-[8px] border border-white/10 bg-black/20 p-3 text-sm">
                <p className="font-medium">{outfit.title}</p>
                <p className="mt-1 text-white/42">Score {outfit.score}</p>
              </div>
            ))}
            {!loading && !stats?.recentUsers?.length && !stats?.recentOutfits?.length && (
              <div className="rounded-[8px] border border-white/10 bg-black/20 p-6 text-center text-sm text-white/45">No recent activity yet.</div>
            )}
          </div>
        </section>
      </div>
    </AppFrame>
  )
}
