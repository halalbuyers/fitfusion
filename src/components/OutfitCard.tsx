import React from 'react'
import Image from 'next/image'

type Item = { image: string; name: string }
type Props = { items: Item[]; score?: number; explanation?: string }

export default function OutfitCard({ items, score = 0, explanation }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 glass">
      <div className="flex gap-3">
        {items.map((it, i) => (
          <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md">
            <Image src={it.image} alt={it.name} fill sizes="64px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-gray-300">Score: {score}</div>
      {explanation && <div className="mt-2 text-xs text-gray-400">{explanation}</div>}
    </div>
  )
}
