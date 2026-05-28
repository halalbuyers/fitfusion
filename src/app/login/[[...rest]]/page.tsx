import { SignIn } from '@clerk/nextjs'

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function LoginPage() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-12">
      {hasClerk ? (
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
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
