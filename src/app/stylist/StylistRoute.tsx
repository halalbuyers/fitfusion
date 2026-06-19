'use client'

import dynamic from 'next/dynamic'

const StylistClient = dynamic(() => import('./StylistClient'), {
  loading: () => (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[8px] bg-white/5" />
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="h-[520px] animate-pulse rounded-[8px] bg-white/5" />
          <div className="h-[520px] animate-pulse rounded-[8px] bg-white/5" />
        </div>
      </div>
    </div>
  )
})

export default function StylistRoute() {
  return <StylistClient />
}
