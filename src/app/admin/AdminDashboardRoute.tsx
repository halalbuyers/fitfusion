'use client'

import dynamic from 'next/dynamic'

type AdminView = 'overview' | 'users' | 'analytics' | 'system' | 'community-updates' | 'training' | 'settings'

const AdminDashboard = dynamic(() => import('./AdminDashboard').then((mod) => mod.AdminDashboard), {
  loading: () => (
    <div className="min-h-screen bg-[#070707] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[260px_1fr]">
        <div className="hidden h-[calc(100vh-2.5rem)] animate-pulse rounded-[8px] bg-white/5 lg:block" />
        <div className="space-y-5">
          <div className="h-24 animate-pulse rounded-[8px] bg-white/5" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-[8px] bg-white/5" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="h-[320px] animate-pulse rounded-[8px] bg-white/5" />
            <div className="h-[320px] animate-pulse rounded-[8px] bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
})

export default function AdminDashboardRoute({ view }: { view?: AdminView }) {
  return <AdminDashboard view={view} />
}
