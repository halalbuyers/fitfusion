"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, LayoutDashboard, MessageCircle, Shirt, Sparkles, Users, UserRound, Wand2 } from 'lucide-react'

const nav: Array<[string, string, LucideIcon]> = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Wardrobe', '/wardrobe', Shirt],
  ['Generator', '/outfit-generator', Wand2],
  ['Outfits', '/outfits', Sparkles],
  ['Calendar', '/calendar', CalendarDays],
  ['Stylist', '/stylist', MessageCircle],
  ['Community', '/community', Users],
  ['Profile', '/profile', UserRound]
]

export function AppFrame({ title, eyebrow, children, action }: { title: string; eyebrow: string; children: React.ReactNode; action?: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="premium-grid min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass hidden h-fit rounded-[8px] p-3 lg:block">
          <div className="px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/35">Studio</div>
          <nav className="mt-2 grid gap-1">
            {nav.map(([label, href, Icon]) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm transition ${isActive(href) ? 'bg-[#d7ff55] text-black' : 'text-white/62 hover:bg-white/8 hover:text-white'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section>
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
            </div>
            {action}
          </div>
          {children}
        </section>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-[8px] border border-white/10 bg-black/80 p-1 backdrop-blur-xl lg:hidden">
        {nav.slice(0, 5).map(([label, href, Icon]) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`flex h-12 flex-col items-center justify-center gap-1 rounded-[6px] text-[10px] transition ${isActive(href) ? 'bg-[#d7ff55] text-black' : 'text-white/58 hover:bg-white/10 hover:text-white'}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="glass rounded-[8px] p-5">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-white/45">{note}</p>
    </div>
  )
}

export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="glass rounded-[8px] p-10 text-center">
      <div className="mx-auto h-20 w-20 rounded-full border border-white/12 bg-white/6" />
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">{body}</p>
      {cta ? <div className="mt-6">{cta}</div> : null}
    </div>
  )
}

export const sampleClothes = [
  { name: 'Oversized Hoodie', category: 'Hoodie', color: 'Black', style: 'Streetwear', season: 'Winter', usage: 8 },
  { name: 'Relaxed Denim', category: 'Jeans', color: 'Light blue', style: 'Casual', season: 'All-season', usage: 11 },
  { name: 'Leather Sneakers', category: 'Shoes', color: 'White', style: 'Minimal', season: 'All-season', usage: 16 },
  { name: 'Tailored Blazer', category: 'Jacket', color: 'Charcoal', style: 'Formal', season: 'Fall', usage: 4 }
]

export const sampleOutfits = [
  { title: 'Winter Streetwear', score: 94, detail: 'Black hoodie, relaxed denim, white sneakers, silver watch.', occasion: 'Casual' },
  { title: 'Founder Dinner', score: 91, detail: 'Charcoal blazer, black tee, tailored pants, leather sneakers.', occasion: 'Formal' },
  { title: 'Travel Layering', score: 88, detail: 'Soft tee, hoodie, dark jeans, weather-ready shoes.', occasion: 'Travel' }
]
