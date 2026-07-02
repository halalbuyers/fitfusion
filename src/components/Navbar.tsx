'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Camera, Home, LayoutDashboard, Menu, MessageCircle, Moon, Shield, Shirt, ShoppingBag, Sparkles, Sun, UserRound, Users, X } from 'lucide-react'
import { ClerkLoaded, ClerkLoading, SignedIn, useUser } from '@clerk/nextjs'

const NavbarAccount = dynamic(() => import('./NavbarAccount'), {
  loading: () => <div className="h-10 w-32 rounded-full bg-white/5" />
})

type NavItem = [label: string, href: string, icon: LucideIcon]

const navItems: NavItem[] = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Wardrobe', '/wardrobe', Shirt],
  ['Shopping', '/shopping', ShoppingBag],
  ['Try-On', '/try-on', Camera],
  ['Outfits', '/outfits', Sparkles],
  ['Calendar', '/calendar', CalendarDays],
  ['AI Stylist', '/stylist', MessageCircle],
  ['Community', '/community', Users],
  ['Profile', '/profile', UserRound]
]

const mobileDrawerItems: NavItem[] = [
  ['Home', '/', Home],
  ...navItems
]

const protectedNavHrefs = new Set(navItems.map(([, href]) => href))

export default function Navbar() {
  const pathname = usePathname() || ''
  const shouldReduceMotion = useReducedMotion()
  const { user } = useUser()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const isAdmin = String(user?.publicMetadata?.role || '').toLowerCase() === 'admin'
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    const saved = window.localStorage.getItem('noircloset-theme') as 'dark' | 'light' | null
    const initial = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    setTheme(initial)
    document.documentElement.classList.toggle('theme-light', initial === 'light')
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('theme-light', next === 'light')
    window.localStorage.setItem('noircloset-theme', next)
  }

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isDrawerOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsDrawerOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isDrawerOpen])

  const drawerItems = isAdmin ? [...mobileDrawerItems, ['Admin', '/admin', Shield] satisfies NavItem] : mobileDrawerItems

  return (
    <nav className="sticky top-0 z-50 h-[var(--navbar-height)] border-b border-white/10 bg-[var(--page-bg)]/78 px-3 backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--page-bg)]/64 sm:px-6">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-lg font-semibold tracking-wide">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-black text-black shadow-[0_0_28px_rgba(215,255,85,0.16)]">NC</span>
          <span className="truncate">Noir Closet</span>
        </Link>
        <div className="hidden items-center gap-1 text-sm text-white/68 lg:flex">
          <ClerkLoading>
            <div className="h-9 w-64 rounded-[8px] bg-white/5" aria-hidden="true" />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedIn>
              {navItems.slice(0, 8).map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={protectedNavHrefs.has(href) ? false : undefined}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`rounded-[8px] px-2.5 py-2 transition ${isActive(href) ? 'bg-[#d7ff55] text-black shadow-[0_0_22px_rgba(215,255,85,0.12)]' : 'hover:bg-white/8 hover:text-white'}`}
                >
                  {label}
                </Link>
              ))}
            </SignedIn>
          </ClerkLoaded>
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
          <NavbarAccount />
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
            className="icon-button h-10 w-10 rounded-full lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isDrawerOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 z-50 cursor-default bg-black/52 backdrop-blur-sm lg:hidden"
              onClick={() => setIsDrawerOpen(false)}
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed right-3 top-3 z-50 w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-[24px] border border-white/12 bg-[#0a0b0d]/88 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden"
              initial={shouldReduceMotion ? false : { opacity: 0, x: 26, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: 18, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            >
              <div className="flex items-center justify-between gap-3 px-2 py-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d7ff55] text-sm font-black text-black">NC</span>
                  <div>
                    <p className="font-semibold text-white">Noir Closet</p>
                    <p className="text-xs text-white/45">Fashion OS</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="icon-button h-10 w-10 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid gap-1.5 rounded-[18px] border border-white/8 bg-white/[0.045] p-2">
                {drawerItems.map(([label, href, Icon]) => (
                  <Link
                    key={href}
                    href={href}
                    prefetch={protectedNavHrefs.has(href) ? false : undefined}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-sm font-medium transition active:scale-[0.99] ${isActive(href) ? 'bg-[#d7ff55] text-black' : 'text-white/68 hover:bg-white/8 hover:text-white'}`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="mt-3 rounded-[18px] border border-[#d7ff55]/18 bg-[#d7ff55]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d7ff55]">Today</p>
                <p className="mt-2 text-sm leading-6 text-white/68">Generate weather-aware outfits from pieces you already own.</p>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </nav>
  )
}
