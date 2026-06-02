'use client'

import { useState } from 'react'
import { AppFrame } from '../../components/AppFrame'
import UploadClothing from '../../components/UploadClothing'
import WardrobeList from '../../components/WardrobeList'

export default function WardrobePage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <AppFrame title="Digital wardrobe" eyebrow="Upload, tag, organize">
      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="glass h-fit rounded-[8px] p-4 sm:p-5 xl:sticky xl:top-5">
          <h2 className="text-lg font-semibold sm:text-xl">Upload clothing</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Add a clothing image, review FitFusion&apos;s AI-assisted tags, then save the final item.
          </p>
          <div className="mt-5">
            <UploadClothing onUploaded={() => setRefreshKey((key) => key + 1)} />
          </div>
        </section>
        <section className="glass rounded-[8px] p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">Your saved pieces</h2>
          <div className="mt-5">
            <WardrobeList refreshKey={refreshKey} />
          </div>
        </section>
      </div>
    </AppFrame>
  )
}
