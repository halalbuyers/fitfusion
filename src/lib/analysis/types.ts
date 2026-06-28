export type AnalysisWardrobeItem = {
  _id?: string
  id?: string
  image?: string
  category?: string
  primaryColor?: string
  color?: string
  colors?: string[]
  secondaryColors?: string[]
  style?: string
  season?: string
  occasion?: string[]
  tags?: string[]
  material?: string
  brand?: string
  condition?: string
  itemPreferenceScore?: number
  wearCount?: number
  usageCount?: number
  lastWornAt?: Date | string | null
  createdAt?: Date | string
}

export type CoverageMetric = {
  key: string
  label: string
  score: number
  count: number
  missing: string[]
  recommendation: string
}

export type ImpactRecommendation = {
  title: string
  category: string
  color?: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedNewCombinations: number
  estimatedImprovementPercent: number
}

