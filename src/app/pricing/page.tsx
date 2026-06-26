import Link from 'next/link'
import { AppFrame } from '../../components/AppFrame'

export default function PricingPage() {
  return (
    <AppFrame title="Free beta access" eyebrow="Monetization disabled">
      <div className="glass rounded-[8px] p-8 text-center">
        <h2 className="text-3xl font-semibold">All Noir Closet features are unlocked during beta.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/55">
          Plans and subscriptions are paused while we focus on AI quality, user growth, community, and feedback.
        </p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-[8px] bg-[#d7ff55] px-5 py-3 text-sm font-semibold text-black">
          Go to dashboard
        </Link>
      </div>
    </AppFrame>
  )
}
