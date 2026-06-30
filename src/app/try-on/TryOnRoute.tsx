"use client"

import dynamic from 'next/dynamic'

const TryOnStudioClient = dynamic(() => import('./TryOnStudioClient'), {
  loading: () => (
    <div className="grid gap-5">
      <div className="h-[540px] animate-pulse rounded-[8px] bg-white/7" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[8px] bg-white/7" />)}
      </div>
    </div>
  )
})

export default function TryOnRoute() {
  return <TryOnStudioClient />
}
