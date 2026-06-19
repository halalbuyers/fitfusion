'use client'

import dynamic from 'next/dynamic'

const CommunityClient = dynamic(() => import('./CommunityClient'), {
  loading: () => (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-[8px] bg-white/5" />
        <div className="h-20 animate-pulse rounded-[8px] bg-white/5" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[520px] animate-pulse rounded-[8px] bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
})

export default function CommunityRoute() {
  return <CommunityClient />
}
