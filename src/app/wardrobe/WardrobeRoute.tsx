'use client'

import dynamic from 'next/dynamic'

const WardrobeClient = dynamic(() => import('./WardrobeClient'), {
  loading: () => (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[8px] bg-white/5" />
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="h-[520px] animate-pulse rounded-[8px] bg-white/5" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-[8px] bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

export default function WardrobeRoute() {
  return <WardrobeClient />
}
