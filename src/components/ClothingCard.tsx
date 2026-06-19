import React from 'react'
import Image from 'next/image'
import { Edit3, Heart } from 'lucide-react'

type Props = {
  image: string
  title: string
  category?: string
  colors?: string[]
  isFavorite?: boolean
  onFavorite?: () => void
  onEdit?: () => void
}

function readableColor(color: string) {
  return color.replace(/-/g, ' ')
}

export default function ClothingCard({ image, title, category, colors = [], isFavorite, onFavorite, onEdit }: Props) {
  const swatches = [...new Set(colors.filter(Boolean))].slice(0, 3)
  const primary = swatches[0]

  return (
    <div className="group overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.055] shadow-xl shadow-black/20 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.985]">
      <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-white/10 to-black/35">
        <Image src={image} alt={title} fill sizes="(min-width: 1280px) 15vw, (min-width: 768px) 28vw, 44vw" className="object-contain p-3 transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-4.25rem)] flex-wrap gap-1.5">
          {category ? <span className="rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/82 backdrop-blur-md">{category}</span> : null}
          {primary ? <span className="rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-semibold capitalize text-white/82 backdrop-blur-md">{readableColor(primary)}</span> : null}
        </div>
        <div className="absolute right-2 top-2 grid gap-1.5">
          {onFavorite ? (
            <button type="button" title={isFavorite ? 'Remove favorite' : 'Favorite'} onClick={onFavorite} className={`icon-button h-9 w-9 bg-black/45 backdrop-blur-md ${isFavorite ? 'text-[#d7ff55]' : ''}`}>
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          ) : isFavorite ? (
            <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-white text-black">
              <Heart className="h-4 w-4 fill-current" />
            </div>
          ) : null}
          {onEdit ? (
            <button type="button" title="Quick edit" onClick={onEdit} className="icon-button h-9 w-9 bg-black/45 backdrop-blur-md">
              <Edit3 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold capitalize">{title}</div>
            <div className="mt-1 truncate text-xs capitalize text-white/45">{category || 'wardrobe piece'}</div>
          </div>
          <div className="flex max-w-[64px] shrink-0 flex-wrap justify-end gap-1">
            {swatches.map((color) => (
              <span key={color} title={readableColor(color)} className="h-3.5 w-3.5 rounded-full border border-white/30 shadow-sm shadow-black/40" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
