import React from 'react'
import type { Metadata } from 'next'
import AppProviders from '../components/AppProviders'
import Navbar from '../components/Navbar'
import AnnouncementSlot from '../components/AnnouncementSlot'
import Footer from '../components/Footer'
import '../styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://noircloset.local'),
  title: {
    default: 'Noir Closet',
    template: '%s | Noir Closet'
  },
  applicationName: 'Noir Closet',
  description: 'Your AI-Powered Smart Wardrobe. Wear Smarter. Powered by AI.',
  keywords: ['Noir Closet', 'AI fashion operating system', 'smart wardrobe', 'AI stylist', 'outfit planner'],
  authors: [{ name: 'Noir Closet' }],
  creator: 'Noir Closet',
  publisher: 'Noir Closet',
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }]
  },
  openGraph: {
    title: 'Noir Closet',
    description: 'Your AI-Powered Smart Wardrobe.',
    siteName: 'Noir Closet',
    type: 'website',
    url: '/'
  },
  twitter: {
    card: 'summary',
    title: 'Noir Closet',
    description: 'Your AI-Powered Smart Wardrobe.'
  },
  robots: {
    index: true,
    follow: true
  },
  verification: {
    google: 'YXcFOx_Oll1oQDqOaCYkp82pScNttHmsML4IWCLMsCY'
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Noir Closet',
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'Web',
              description: 'Your AI-Powered Smart Wardrobe.'
            })
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
      </body>
    </html>
  )
}
