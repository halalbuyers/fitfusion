'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const NavbarAccount = dynamic(() => import('./NavbarAccount'), {
  loading: () => <div className="h-10 w-32 rounded-full bg-white/5" />
})

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Wardrobe', '/wardrobe'],
  ['Outfits', '/outfits'],
  ['AI Stylist', '/stylist'],
  ['Community', '/community'],
  ['Pricing', '/pricing']
]

const protectedNavHrefs = new Set(['/dashboard', '/wardrobe', '/outfits', '/stylist', '/community'])

export default function Navbar() {
  const pathname = usePathname() || ''
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const appRoutes = ['/dashboard', '/wardrobe', '/my-wardrobe', '/outfit-generator', '/outfits', '/stylist', '/community', '/profile', '/settings', '/admin', '/weather', '/calendar']
  const isAppRoute = appRoutes.some((href) => pathname === href || pathname.startsWith(`${href}/`))

  useEffect(() => {
    const saved = window.localStorage.getItem('fitfusion-theme') as 'dark' | 'light' | null
    const initial = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    setTheme(initial)
    document.documentElement.classList.toggle('theme-light', initial === 'light')
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('theme-light', next === 'light')
    window.localStorage.setItem('fitfusion-theme', next)
  }

  return (
    <nav className={`sticky top-0 z-50 border-b border-white/10 bg-[var(--page-bg)]/90 px-3 py-3 backdrop-blur-xl sm:px-6 ${isAppRoute ? 'hidden lg:block' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-lg font-semibold tracking-wide">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-black text-black">FF</span>
          <span className="truncate">FitFusion</span>
        </Link>
        <div className="hidden items-center gap-2 text-sm text-white/68 md:flex">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              prefetch={protectedNavHrefs.has(href) ? false : undefined}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`rounded-[8px] px-3 py-2 transition ${isActive(href) ? 'bg-white text-black' : 'hover:bg-white/8 hover:text-white'}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="icon-button h-10 w-10 rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isAppRoute ? (
            <NavbarAccount />
          ) : (
            <>
              <Link href="/login" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/35 hover:text-white sm:block">Sign in</Link>
              <Link href="/register" className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-black transition hover:bg-white/88 sm:px-4">Create Your FitFusion Account</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
