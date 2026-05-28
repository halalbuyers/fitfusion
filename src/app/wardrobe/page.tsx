'use client'

import { useState } from 'react'
import { AppFrame } from '../../components/AppFrame'
import UploadClothing from '../../components/UploadClothing'
import WardrobeList from '../../components/WardrobeList'

export default function WardrobePage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <AppFrame title="Digital wardrobe" eyebrow="Upload, tag, organize">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Upload clothing</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Add a clothing image and FitFusion will save it to your wardrobe with AI-assisted tags.
          </p>
          <div className="mt-5">
            <UploadClothing onUploaded={() => setRefreshKey((key) => key + 1)} />
          </div>
        </section>
        <section className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Your saved pieces</h2>
          <div className="mt-5">
            <WardrobeList refreshKey={refreshKey} />
          </div>
        </section>
      </div>
    </AppFrame>
  )
}
