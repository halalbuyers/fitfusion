'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { AtSign, Code2, Mail, MessageCircle, Radio, Send } from 'lucide-react'

type FooterLink = {
  label: string
  href?: string
  protected?: boolean
}

const groups = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard', protected: true },
      { label: 'Wardrobe', href: '/wardrobe', protected: true },
      { label: 'Shopping', href: '/shopping', protected: true },
      { label: 'Try-On', href: '/try-on', protected: true },
      { label: 'Outfits', href: '/outfits', protected: true },
      { label: 'Calendar', href: '/calendar', protected: true },
      { label: 'AI Stylist', href: '/stylist', protected: true }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'Community', href: '/community', protected: true },
      { label: 'Profile', href: '/profile', protected: true },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Contact', href: 'mailto:hello@noircloset.app' }
    ]
  },
  {
    title: 'Stack',
    links: [
      { label: 'MongoDB' },
      { label: 'Cloudinary' },
      { label: 'OpenAI' },
      { label: 'Vercel' }
    ]
  }
] satisfies Array<{ title: string; links: FooterLink[] }>

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com', icon: Code2 },
  { label: 'Discord', href: 'https://discord.com', icon: MessageCircle },
  { label: 'Instagram', href: 'https://instagram.com', icon: AtSign }
]

export default function Footer() {
  const pathname = usePathname() || ''
  const appRoutes = ['/dashboard', '/wardrobe', '/shopping', '/my-wardrobe', '/outfit-generator', '/outfits', '/stylist', '/community', '/profile', '/settings', '/admin', '/weather', '/calendar', '/try-on', '/trips']
  const isAppRoute = appRoutes.some((href) => pathname === href || pathname.startsWith(`${href}/`))

  return (
    <footer className={`premium-grid border-t border-white/10 bg-[var(--page-bg)] px-4 py-12 sm:px-6 sm:py-16 ${isAppRoute ? 'hidden lg:block' : ''}`}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.95fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-4 text-2xl font-semibold">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#d7ff55] text-base font-black text-black shadow-[0_0_36px_rgba(215,255,85,0.16)]">NC</span>
              Noir Closet
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/58">
              AI wardrobe intelligence for people who want better outfits with less guesswork and fewer disposable purchases.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="icon-button h-11 w-11 rounded-full"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <form className="rounded-[8px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl" onSubmit={(event) => event.preventDefault()}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d7ff55]/12 text-[#d7ff55]">
                <Radio className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-semibold text-white">Style intelligence brief</h3>
                <p className="mt-1 text-sm text-white/48">Product notes, AI wardrobe ideas, and beta updates.</p>
              </div>
            </div>
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/36" />
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@domain.com"
                  className="field h-12 rounded-full pl-10"
                />
              </div>
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#d7ff55] px-5 text-sm font-black text-black transition hover:bg-[#e7ff8f]">
                Join
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
          {groups.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/55">
                {links.map((link) => 'href' in link ? (
                  link.href?.startsWith('mailto:') ? (
                    <a key={link.label} href={link.href} className="transition hover:text-white">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} href={link.href} prefetch={link.protected ? false : undefined} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  )
                ) : (
                  <span key={link.label} className="text-white/45">
                    {link.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>Copyright 2026 Noir Closet. Built for open beta AI fashion workflows.</span>
          <span>Black luxury interface. Lime intelligence layer.</span>
        </div>
      </div>
    </footer>
  )
}
