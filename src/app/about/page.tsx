import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('About', 'Noir Closet is an AI Fashion Operating System for organizing your closet, generating outfits, and discovering your style.', '/about')

export default function AboutPage() {
  return (
    <main className="premium-grid px-4 py-16 sm:px-6">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />
      <section className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">AI Fashion Operating System</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-7xl">Noir Closet</h1>
        <p className="mt-6 text-lg leading-8 text-white/60">
          Noir Closet is an AI-powered smart wardrobe that helps you organize your closet, generate personalized outfits, receive AI styling advice, plan outfits with a calendar, and discover your unique fashion style.
        </p>
        <Link href="/register" className="mt-8 inline-flex rounded-[8px] bg-[#d7ff55] px-5 py-3 text-sm font-semibold text-black">Start building your wardrobe</Link>
      </section>
    </main>
  )
}
