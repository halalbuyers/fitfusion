import type { Metadata } from 'next'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://noircloset.com').replace(/\/$/, '')

export const SITE_NAME = 'Noir Closet'
export const SITE_TITLE = 'Noir Closet – AI Fashion Operating System'
export const SITE_DESCRIPTION = 'Noir Closet is an AI-powered smart wardrobe that helps you organize your closet, generate personalized outfits, receive AI styling advice, plan outfits with a calendar, and discover your unique fashion style.'
export const SITE_KEYWORDS = [
  'AI Wardrobe',
  'AI Fashion',
  'Wardrobe Organizer',
  'Outfit Generator',
  'Virtual Closet',
  'Fashion AI',
  'Closet Manager',
  'Personal Stylist',
  'Smart Closet',
  'Fashion Calendar'
]

export const PUBLIC_ROUTES = [
  { path: '/', label: 'Home', priority: 1 },
  { path: '/about', label: 'About', priority: 0.8 },
  { path: '/community', label: 'Community', priority: 0.7 },
  { path: '/calendar', label: 'Calendar', priority: 0.6 },
  { path: '/stylist', label: 'AI Stylist', priority: 0.6 },
  { path: '/pricing', label: 'Pricing', priority: 0.4 },
  { path: '/updates', label: 'Updates', priority: 0.7 },
  { path: '/privacy', label: 'Privacy', priority: 0.3 },
  { path: '/terms', label: 'Terms', priority: 0.3 }
] as const

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg')
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/community?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }
}

export function softwareJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  }
}

export function pageMetadata(title: string, description = SITE_DESCRIPTION, path = '/'): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title: title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }]
    },
    twitter: {
      card: 'summary_large_image',
      title: title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`,
      description,
      images: ['/og-image.png']
    }
  }
}
