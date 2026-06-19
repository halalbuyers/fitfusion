'use client'

import dynamic from 'next/dynamic'

const FashionProfileAnalytics = dynamic(() => import('../../../../components/FashionProfileAnalytics').then((mod) => mod.FashionProfileAnalytics), {
  loading: () => (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-[8px] bg-white/5" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[360px] animate-pulse rounded-[8px] bg-white/5" />
        <div className="h-[360px] animate-pulse rounded-[8px] bg-white/5" />
      </div>
    </div>
  )
})

export default function FashionProfileAnalyticsRoute() {
  return <FashionProfileAnalytics />
}
