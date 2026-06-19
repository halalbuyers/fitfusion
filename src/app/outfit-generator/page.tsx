import type { Metadata } from 'next'
import OutfitGeneratorRoute from './OutfitGeneratorRoute'

export const metadata: Metadata = {
  title: 'Outfit Generator | FitFusion',
  description: 'Generate weather-aware outfits from your FitFusion wardrobe for any occasion.'
}

export default function OutfitGeneratorPage() {
  return <OutfitGeneratorRoute />
}
