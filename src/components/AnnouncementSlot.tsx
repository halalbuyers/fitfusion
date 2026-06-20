'use client'

import dynamic from 'next/dynamic'

const AnnouncementBar = dynamic(() => import('./AnnouncementBar'), {
  ssr: false
})

export default function AnnouncementSlot() {
  return (
    <div className="h-10">
      <AnnouncementBar />
    </div>
  )
}
