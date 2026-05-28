import React from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'

type Props = {
  image: string
  title: string
  category?: string
  colors?: string[]
  isFavorite?: boolean
}

export default function ClothingCard({ image, title, category, colors = [], isFavorite }: Props) {
  return (
    <div className="group overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07]">
      <div className="relative flex aspect-[4/5] w-full items-center justify-center bg-black/35">
        <Image src={image} alt={title} fill sizes="(min-width: 1024px) 18vw, 45vw" className="object-contain p-3 transition duration-500 group-hover:scale-105" />
        {isFavorite ? (
          <div className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-black">
            <Heart className="h-3.5 w-3.5 fill-current" />
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-medium capitalize">{title}</div>
            <div className="mt-1 text-xs capitalize text-white/45">{category}</div>
          </div>
          <div className="flex max-w-[64px] flex-wrap justify-end gap-1">
            {colors.slice(0, 3).map((color) => (
              <span key={color} title={color} className="h-3 w-3 rounded-full border border-white/25" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
