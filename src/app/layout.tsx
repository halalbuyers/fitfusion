import React from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { OnboardingGuard } from '../components/OnboardingGuard'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../styles/globals.css'

export const metadata = {
  title: 'FitFusion',
  description: 'AI-powered personal stylist and wardrobe manager'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          publishableKey={
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string
          }
        >
          <OnboardingGuard>
            <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--text-main)]">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </OnboardingGuard>
        </ClerkProvider>
      </body>
    </html>
  )
}
