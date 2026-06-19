'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function RegisterClient() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      router.replace('/dashboard')
    }
  }, [isLoaded, router, userId])

  if (hasClerk && (!isLoaded || userId)) {
    return (
      <div className="grid min-h-[80vh] place-items-center px-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#d7ff55]" />
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
