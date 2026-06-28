import type { PersonalizationProfile } from '../personalization-engine'
import type { WardrobeEngineItem } from '../outfit-engine'

export type StylistChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type StylistMemory = PersonalizationProfile & {
  favoriteBrands: string[]
  weatherPreferences: string[]
  occasionPreferences: string[]
  dislikedClothing: string[]
  recentOutfitKeys: string[]
  savedOutfitKeys: string[]
  wornOutfitKeys: string[]
  mostWornColors: string[]
  mostWornCategories: string[]
  preferredStyle: string
  wardrobeSize: number
}

export type StylistConversationIntent =
  | 'daily'
  | 'recommendation'
  | 'refinement'
  | 'trip'
  | 'interview'
  | 'aesthetic'
  | 'korean'
  | 'taller'
  | 'luxury'
  | 'missing'
  | 'least-worn'
  | 'weekly-report'
  | 'explain'

export type StylistConversationContext = {
  prompt: string
  messages: StylistChatMessage[]
  intent: StylistConversationIntent
  occasion: string
  styleGoal?: string
  refinement?: {
    moreFormal?: boolean
    changeShoes?: boolean
    color?: string
    removeLayer?: boolean
    oversized?: boolean
  }
}

export type StylistContextBundle = {
  userId: string
  wardrobe: WardrobeEngineItem[]
  memory: StylistMemory
  conversation: StylistConversationContext
  weather?: { temperature?: number; condition?: string; suggestion?: string; source?: string }
  calendar?: Array<{ occasion?: string; date?: Date | string; notes?: string }>
}

export type StylistOutfitCardItem = {
  id?: string
  label: string
  role: string
  image?: string
  category?: string
  color?: string
}

export type StylistOutfitCard = {
  top: string
  bottom: string
  shoes: string
  style: string
  reason: string
  score?: number
  items?: StylistOutfitCardItem[]
  missing?: Array<{ title: string; estimatedNewCombinations?: number; estimatedImprovementPercent?: number }>
  followUps?: string[]
}

export type StylistV2Response = {
  reply: string
  intent: StylistConversationIntent
  method: 'local-v2' | 'hybrid-v2' | 'local'
  outfitCard?: StylistOutfitCard
  suggestions: string[]
  memorySummary?: string
}
