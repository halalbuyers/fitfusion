'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { SignedIn, SignedOut, SignOutButton, UserButton, useUser } from '@clerk/nextjs'

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Wardrobe', '/wardrobe'],
  ['Outfits', '/outfits'],
  ['AI Stylist', '/stylist'],
  ['Community', '/community'],
  ['Pricing', '/pricing']
]

export default function Navbar() {
  const { user } = useUser()
  const pathname = usePathname() || ''
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#070707]/78 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-black text-black">FF</span>
          <span>FitFusion</span>
        </Link>
        <div className="hidden items-center gap-2 text-sm text-white/68 md:flex">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`rounded-[8px] px-3 py-2 transition ${isActive(href) ? 'bg-white text-black' : 'hover:bg-white/8 hover:text-white'}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/login" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/35 hover:text-white sm:block">Sign in</Link>
            <Link href="/register" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/88">Start free</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="hidden text-sm text-white/70 transition hover:text-white sm:block">
              {user?.firstName ? `Hi, ${user.firstName}` : 'Dashboard'}
            </Link>
            <SignOutButton>
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition hover:border-white/40 hover:text-white"
              >
                Logout
              </button>
            </SignOutButton>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9'
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}
