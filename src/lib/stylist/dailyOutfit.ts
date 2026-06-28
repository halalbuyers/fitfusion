import type { StylistContextBundle } from './types'
import { recommendFromWardrobe } from './recommendationEngine'

export function generateDailyOutfit(bundle: StylistContextBundle) {
  const calendarOccasion = bundle.calendar?.[0]?.occasion
  return recommendFromWardrobe({
    ...bundle,
    conversation: {
      ...bundle.conversation,
      occasion: calendarOccasion || bundle.conversation.occasion || bundle.memory.occasionPreferences[0] || 'casual'
    }
  })
}

