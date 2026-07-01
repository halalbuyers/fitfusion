import React from 'react'
import type { Metadata } from 'next'
import Analytics from '@/components/GoogleAnalytics'
import AppProviders from '../components/AppProviders'
import Navbar from '../components/Navbar'
import AnnouncementSlot from '../components/AnnouncementSlot'
import Footer from '../components/Footer'
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL, organizationJsonLd, softwareJsonLd, websiteJsonLd } from '../lib/seo'
import '../styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`
  },
  applicationName: SITE_NAME,
  category: 'Lifestyle',
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  openGraph: {
    title: SITE_NAME,
    description: 'AI Fashion Operating System',
    siteName: SITE_NAME,
    type: 'website',
    url: '/',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }]
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'AI Fashion Operating System',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION } : undefined
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://img.clerk.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://img.clerk.com" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "xfjpcfhfxu");
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd(), websiteJsonLd(), softwareJsonLd()])
          }}
        />
      </head>
      <body>
        <AppProviders>
          <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--text-main)]">
            <Navbar />
            <AnnouncementSlot />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AppProviders>
        <Analytics />
      </body>
    </html>
  )
}
