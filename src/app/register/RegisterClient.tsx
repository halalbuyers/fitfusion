'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function RegisterClient() {
  const { isLoaded, userId } = useAuth()

  if (hasClerk && !isLoaded) {
    return (
      <div className="grid min-h-[80vh] place-items-center px-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#d7ff55]" />
      </div>
    )
  }

  if (hasClerk && userId) {
    return (
      <div className="grid min-h-[80vh] place-items-center px-4 py-12">
        <div className="glass w-full max-w-md rounded-2xl p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">Account ready</p>
          <h1 className="mt-3 text-3xl font-semibold">You already have a FitFusion session</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Continue to your dashboard instead of creating another account.</p>
          <Link href="/dashboard" prefetch={false} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
            Continue to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-12">
      {hasClerk ? (
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
          signInFallbackRedirectUrl="/dashboard"
        />
      ) : (
        <div className="glass w-full max-w-md rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">Start free</p>
          <h1 className="mt-3 text-3xl font-semibold">Create your wardrobe</h1>
          <div className="mt-6 grid gap-4">
            <input className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/35" placeholder="Name" />
            <input className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/35" placeholder="Email" />
            <input className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/35" placeholder="Password" type="password" />
            <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Create account</button>
          </div>
          <p className="mt-4 text-sm text-white/45">Add Clerk keys in `.env.local` to enable live signup and Google login.</p>
        </div>
      )}
    </div>
  )
}
