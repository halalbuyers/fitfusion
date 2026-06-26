import type { MetadataRoute } from 'next'
import { PUBLIC_ROUTES, absoluteUrl } from '../lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.path === '/updates' ? 'weekly' : 'monthly',
    priority: route.priority
  }))
}
