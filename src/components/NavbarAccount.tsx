'use client'

import { SignedIn, SignedOut, SignOutButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function NavbarAccount() {
  const { user } = useUser()

  return (
    <>
      <SignedOut>
        <Link href="/login" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/35 hover:text-white sm:block">Sign in</Link>
        <Link href="/register" className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-black transition hover:bg-white/88 sm:px-4">Create Your Noir Closet Account</Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className="hidden text-sm text-white/70 transition hover:text-white sm:block">
          {user?.firstName ? `Hi, ${user.firstName}` : 'Dashboard'}
        </Link>
        <SignOutButton>
          <button
            type="button"
            className="hidden rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition hover:border-white/40 hover:text-white sm:block"
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
    </>
  )
}
