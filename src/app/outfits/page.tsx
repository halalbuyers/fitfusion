"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarPlus, Heart, Sparkles } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Clothing = { _id: string; image: string; category: string }
type Outfit = {
  _id: string
  title: string
  occasion: string
  score: number
  explanation?: string
  isFavorite?: boolean
  plannedFor?: string
  items: Array<{ clothing?: Clothing; role?: string }>
}

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/outfits')
      .then((res) => res.json())
      .then((data) => setOutfits(Array.isArray(data) ? data : []))
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false))
  }, [])

  async function favorite(outfit: Outfit) {
    setOutfits((current) => current.map((item) => item._id === outfit._id ? { ...item, isFavorite: !item.isFavorite } : item))
    await fetch(`/api/outfits/${outfit._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: !outfit.isFavorite })
    }).catch(() => undefined)
  }

  return (
    <AppFrame title="Saved outfits" eyebrow="Rotation and favorites" action={<Link href="/outfit-generator" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black">Generate</Link>}>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
      ) : outfits.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outfits.map((outfit) => (
            <article key={outfit._id} className="overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.04]">
              <div className="grid grid-cols-2 gap-px bg-white/10">
                {outfit.items.slice(0, 4).map((item, index) => item.clothing ? (
                  <div key={`${item.clothing._id}-${index}`} className="relative aspect-square bg-black/35">
                    <Image src={item.clothing.image} alt={item.clothing.category} fill sizes="180px" className="object-contain p-3" />
                  </div>
                ) : <div key={index} className="aspect-square bg-black/35" />)}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/35">{outfit.occasion}</p>
                    <h2 className="mt-2 font-semibold">{outfit.title}</h2>
                  </div>
                  <span className="rounded-[8px] bg-white px-2.5 py-1 text-sm font-bold text-black">{outfit.score}</span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/50">{outfit.explanation}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => favorite(outfit)} className="icon-button h-10 w-10">
                    <Heart className={`h-4 w-4 ${outfit.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <Link href="/calendar" className="icon-button h-10 w-10">
                    <CalendarPlus className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-white/45" />
          <h2 className="mt-4 text-xl font-semibold">No saved outfits yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Generate a few local recommendations, save the best ones, and they will appear here for planning.</p>
          <Link href="/outfit-generator" className="mt-5 inline-flex rounded-[8px] bg-[#d7ff55] px-5 py-3 text-sm font-semibold text-black">Open generator</Link>
        </div>
      )}
    </AppFrame>
  )
}
