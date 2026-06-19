'use client'

import dynamic from 'next/dynamic'

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  loading: () => (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-[8px] bg-white/5" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[8px] bg-white/5" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-[420px] animate-pulse rounded-[8px] bg-white/5" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-[8px] bg-white/5" />
            <div className="h-40 animate-pulse rounded-[8px] bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
})

export default function DashboardRoute() {
  return <DashboardClient />
}
