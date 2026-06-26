import type { Metadata } from 'next'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('Terms of Service', 'Terms of service for Noir Closet.', '/terms')

export default function TermsPage() {
  return (
    <main className="px-4 py-16 sm:px-6">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Terms', path: '/terms' }])} />
      <article className="glass mx-auto max-w-3xl rounded-[8px] p-8">
        <h1 className="text-4xl font-semibold">Terms of Service</h1>
        <p className="mt-5 text-sm leading-7 text-white/60">
          Noir Closet provides AI-assisted wardrobe organization, outfit generation, styling recommendations, calendar planning, and community tools.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/60">
          Production legal terms should be reviewed before launch. Beta access is provided as-is while the product is actively improving.
        </p>
      </article>
    </main>
  )
}
