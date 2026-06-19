'use client'

import dynamic from 'next/dynamic'

const OutfitGeneratorClient = dynamic(() => import('./OutfitGeneratorClient'), {
  loading: () => (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[8px] bg-white/5" />
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[420px] animate-pulse rounded-[8px] bg-white/5" />
          <div className="h-[420px] animate-pulse rounded-[8px] bg-white/5" />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[360px] animate-pulse rounded-[8px] bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
})

export default function OutfitGeneratorRoute() {
  return <OutfitGeneratorClient />
}
