import type { Metadata } from 'next'
import OutfitGeneratorRoute from './OutfitGeneratorRoute'

export const metadata: Metadata = {
  title: 'Outfit Generator',
  description: 'Generate weather-aware outfits from your Noir Closet wardrobe for any occasion.'
}

export default function OutfitGeneratorPage() {
  return <OutfitGeneratorRoute />
}
