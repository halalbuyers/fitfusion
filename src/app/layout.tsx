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
