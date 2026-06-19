'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export default function Footer() {
  const pathname = usePathname() || ''
  const appRoutes = ['/dashboard', '/wardrobe', '/my-wardrobe', '/outfit-generator', '/outfits', '/stylist', '/community', '/profile', '/settings', '/admin', '/weather', '/calendar']
  const isAppRoute = appRoutes.some((href) => pathname === href || pathname.startsWith(`${href}/`))

  const groups = [
    ['Product', ['Wardrobe', 'Outfits', 'Calendar', 'AI Stylist']],
    ['Company', ['Community', 'Pricing', 'Admin', 'Profile']],
    ['Deploy', ['MongoDB', 'Cloudinary', 'OpenAI', 'Vercel']]
  ] as const

  return (
    <footer className={`border-t border-white/10 bg-[var(--page-bg)] px-4 py-10 sm:px-6 ${isAppRoute ? 'hidden lg:block' : ''}`}>
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-black text-black">FF</span>
            FitFusion
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
            AI wardrobe intelligence for people who want better outfits with less guesswork.
          </p>
        </div>
        {groups.map(([title, links]) => (
          <div key={title}>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <div className="mt-4 grid gap-3 text-sm text-white/55">
              {links.map((link) => (
                <Link key={link} href={`/${link.toLowerCase().replace(' ', '-')}`} className="transition hover:text-white">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl text-xs text-white/35">Copyright 2026 FitFusion. Built for premium AI fashion workflows.</div>
    </footer>
  )
}
