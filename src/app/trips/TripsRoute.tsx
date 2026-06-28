"use client"

import dynamic from 'next/dynamic'

const TripsClient = dynamic(() => import('./TripsClient'), {
  loading: () => (
    <div className="grid gap-5">
      <div className="h-64 animate-pulse rounded-[8px] bg-white/7" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-[8px] bg-white/7" />)}
      </div>
    </div>
  )
})

export default function TripsRoute() {
  return <TripsClient />
}

