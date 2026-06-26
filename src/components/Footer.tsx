'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

type FooterLink = {
  label: string
  href?: string
  protected?: boolean
}

const groups = [
  {
    title: 'Product',
    links: [
      { label: 'Wardrobe', href: '/wardrobe', protected: true },
      { label: 'Outfits', href: '/outfits', protected: true },
      { label: 'Calendar', href: '/calendar', protected: true },
      { label: 'AI Stylist', href: '/stylist', protected: true }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'Community', href: '/community', protected: true },
      { label: 'Admin', href: '/admin', protected: true },
      { label: 'Profile', href: '/profile', protected: true }
    ]
  },
  {
    title: 'Deploy',
    links: [
      { label: 'MongoDB' },
      { label: 'Cloudinary' },
      { label: 'OpenAI' },
      { label: 'Vercel' }
    ]
  }
] satisfies Array<{ title: string; links: FooterLink[] }>

export default function Footer() {
  const pathname = usePathname() || ''
  const appRoutes = ['/dashboard', '/wardrobe', '/my-wardrobe', '/outfit-generator', '/outfits', '/stylist', '/community', '/profile', '/settings', '/admin', '/weather', '/calendar']
  const isAppRoute = appRoutes.some((href) => pathname === href || pathname.startsWith(`${href}/`))

  return (
    <footer className={`border-t border-white/10 bg-[var(--page-bg)] px-4 py-10 sm:px-6 ${isAppRoute ? 'hidden lg:block' : ''}`}>
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-black text-black">NC</span>
            Noir Closet
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
            AI wardrobe intelligence for people who want better outfits with less guesswork.
          </p>
        </div>
        {groups.map(({ title, links }) => (
          <div key={title}>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <div className="mt-4 grid gap-3 text-sm text-white/55">
              {links.map((link) => 'href' in link ? (
                <Link key={link.label} href={link.href} prefetch={link.protected ? false : undefined} className="transition hover:text-white">
                  {link.label}
                </Link>
              ) : (
                <span key={link.label} className="text-white/45">
                  {link.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl text-xs text-white/35">Copyright 2026 Noir Closet. Built for open beta AI fashion workflows.</div>
    </footer>
  )
}
