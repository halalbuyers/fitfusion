'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function LoginClient() {
  const { isLoaded, userId } = useAuth()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams?.get('redirect_url') || '/dashboard'

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
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">Signed in</p>
          <h1 className="mt-3 text-3xl font-semibold">You are already signed in</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Continue to your FitFusion workspace.</p>
          <Link href={redirectUrl} prefetch={false} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
            Continue to FitFusion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-12">
      {hasClerk ? (
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl={redirectUrl}
          signUpFallbackRedirectUrl={redirectUrl}
        />
      ) : (
        <div className="glass w-full max-w-md rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold">Sign in to FitFusion</h1>
          <div className="mt-6 grid gap-4">
            <input className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/35" placeholder="Email" />
            <input className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/35" placeholder="Password" type="password" />
            <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Sign in</button>
          </div>
          <p className="mt-4 text-sm text-white/45">Add Clerk keys in `.env.local` to enable live authentication.</p>
        </div>
      )}
    </div>
  )
}
