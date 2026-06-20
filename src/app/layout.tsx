import React from 'react'
import AppProviders from '../components/AppProviders'
import Navbar from '../components/Navbar'
import AnnouncementSlot from '../components/AnnouncementSlot'
import Footer from '../components/Footer'
import '../styles/globals.css'

export const metadata = {
  title: 'FitFusion',
  description: 'AI-powered personal stylist and wardrobe manager',
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
        <link rel="preload" as="image" href="/images/hero-fashion.webp" fetchPriority="high" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://img.clerk.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://img.clerk.com" />
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
