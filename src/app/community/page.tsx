import type { Metadata } from 'next'
import CommunityRoute from './CommunityRoute'

export const metadata: Metadata = {
  title: 'Community',
  description: 'Explore Noir Closet community outfit posts, styling inspiration, and creator fashion feeds.'
}

export default function CommunityPage() {
  return <CommunityRoute />
}
