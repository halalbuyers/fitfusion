import type { Metadata } from 'next'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('Privacy Policy', 'Privacy information for Noir Closet users.', '/privacy')

export default function PrivacyPage() {
  return (
    <main className="px-4 py-16 sm:px-6">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Privacy', path: '/privacy' }])} />
      <article className="glass mx-auto max-w-3xl rounded-[8px] p-8">
        <h1 className="text-4xl font-semibold">Privacy Policy</h1>
        <p className="mt-5 text-sm leading-7 text-white/60">
          Noir Closet uses account, wardrobe, outfit, and preference data to provide smart wardrobe organization, outfit generation, styling advice, calendar planning, and community features.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/60">
          Production privacy terms should be reviewed before launch. During beta, avoid uploading sensitive personal information that is not needed for styling.
        </p>
      </article>
    </main>
  )
}
