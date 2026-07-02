"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { SignedIn, useAuth } from '@clerk/nextjs'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Camera, LayoutDashboard, MessageCircle, Plane, Shield, Shirt, ShoppingBag, Sparkles, UserRound, Users, Wand2 } from 'lucide-react'

const desktopNav: Array<[string, string, LucideIcon]> = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Wardrobe', '/wardrobe', Shirt],
  ['Outfit Generator', '/outfit-generator', Wand2],
  ['Shopping', '/shopping', ShoppingBag],
  ['Try-On Studio', '/try-on', Camera],
  ['Calendar', '/calendar', CalendarDays],
  ['Trips', '/trips', Plane],
  ['AI Stylist', '/stylist', MessageCircle],
  ['Saved Outfits', '/outfits', Sparkles],
  ['Community', '/community', Users],
  ['Profile', '/profile', UserRound],
  ['Admin', '/admin', Shield]
]
const mobileNav: Array<[string, string, LucideIcon]> = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Wardrobe', '/wardrobe', Shirt],
  ['Generate', '/outfit-generator', Wand2],
  ['Shop', '/shopping', ShoppingBag],
  ['Try-On', '/try-on', Camera],
  ['Stylist', '/stylist', MessageCircle]
]

export function AppFrame({ title, eyebrow, children, action }: { title: string; eyebrow: string; children: React.ReactNode; action?: React.ReactNode }) {
  const pathname = usePathname() || ''
  const { isLoaded, isSignedIn } = useAuth()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="premium-grid min-h-screen px-3 pb-24 pt-4 sm:px-6 sm:py-7 lg:pb-8">
      <div className={`mx-auto grid max-w-[1480px] gap-5 ${isLoaded && isSignedIn ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}>
        <SignedIn>
          <aside className="glass sticky top-5 hidden h-[calc(100vh-2.5rem)] rounded-[8px] p-4 lg:block">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#d7ff55] text-sm font-black text-black">NC</div>
              <div>
                <p className="text-sm font-semibold">Noir Closet</p>
                <p className="text-xs text-white/42">Fashion OS</p>
              </div>
            </div>
            <nav className="mt-7 grid gap-1.5" aria-label="Primary navigation">
              {desktopNav.map(([label, href, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition ${isActive(href) ? 'bg-[#d7ff55] text-black shadow-lg shadow-[#d7ff55]/10' : 'text-white/62 hover:bg-white/8 hover:text-white'}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="absolute inset-x-4 bottom-4 rounded-[8px] border border-white/10 bg-black/24 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">Today</p>
              <p className="mt-2 text-sm leading-5 text-white/64">Build weather-aware outfits from pieces you already own.</p>
            </div>
          </aside>
        </SignedIn>
        <section className="min-w-0">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">{eyebrow}</p>
              <h1 className="accent-text mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
            </div>
            {action ? <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
          </div>
          {children}
        </section>
      </div>
      <SignedIn>
        <nav className="fixed inset-x-2 bottom-2 z-40 grid grid-cols-6 gap-1 rounded-[8px] border border-white/10 bg-[var(--page-bg)]/88 p-1 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:inset-x-3 sm:bottom-3 lg:hidden" aria-label="Mobile navigation">
          {mobileNav.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`flex h-13 min-h-[52px] flex-col items-center justify-center gap-1 rounded-[6px] text-[10px] transition active:scale-[0.98] ${isActive(href) ? 'bg-[#d7ff55] text-black' : 'text-white/58 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </SignedIn>
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
