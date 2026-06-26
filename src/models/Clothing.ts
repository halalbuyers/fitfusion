import mongoose, { Schema, Document } from 'mongoose'
import type { ClothingCategory, FashionStyle, FitType, Season } from '../lib/fashion-analysis'

export interface IClothing extends Document {
  userId: string
  image: string
  category: ClothingCategory | string
  primaryColor: string
  secondaryColors: string[]
  color: string
  colors: string[]
  style: FashionStyle | string
  season: Season | string
  occasion: string[]
  tags: string[]
  brand?: string
  fit: FitType | string
  fitType?: string
  formalityScore: number
  warmthScore: number
  material?: string
  favorite: boolean
  isFavorite: boolean
  itemPreferenceScore: number
  wearCount: number
  usageCount: number
  lastWornAt: Date | null
  embedding?: number[]
  embeddingVersion?: number
  aiCategory?: string
  aiColor?: string
  categoryConfidence?: number
  colorConfidence?: number
  correctedByUser?: boolean
  createdAt: Date
}

const ClothingSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  image: { type: String, required: true },
  category: { type: String, required: true, index: true },
  primaryColor: { type: String, default: 'unknown', index: true },
  secondaryColors: { type: [String], default: [] },
  color: { type: String, default: 'unknown' },
  colors: { type: [String], default: [] },
  style: { type: String, default: 'minimal', index: true },
  season: { type: String, default: 'all-season' },
  occasion: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  brand: { type: String },
  fit: { type: String, default: 'regular' },
  fitType: { type: String, default: 'regular' },
  formalityScore: { type: Number, default: 45, min: 0, max: 100 },
  warmthScore: { type: Number, default: 45, min: 0, max: 100 },
  material: { type: String },
  favorite: { type: Boolean, default: false, index: true },
  isFavorite: { type: Boolean, default: false, index: true },
  itemPreferenceScore: { type: Number, default: 0, index: true },
  wearCount: { type: Number, default: 0 },
  usageCount: { type: Number, default: 0 },
  lastWornAt: { type: Date, default: null },
  embedding: { type: [Number], default: undefined },
  embeddingVersion: { type: Number, default: 0, index: true },
  aiCategory: { type: String },
  aiColor: { type: String },
  categoryConfidence: { type: Number, default: 0, min: 0, max: 100 },
  colorConfidence: { type: Number, default: 0, min: 0, max: 100 },
  correctedByUser: { type: Boolean, default: false, index: true }
}, { timestamps: true })

ClothingSchema.index({ userId: 1, category: 1 })
ClothingSchema.index({ userId: 1, style: 1 })
ClothingSchema.index({ userId: 1, primaryColor: 1 })
ClothingSchema.index({ userId: 1, season: 1 })
ClothingSchema.index({ userId: 1, createdAt: -1 })

ClothingSchema.pre('save', function syncLegacyFields(next) {
  const doc = this as IClothing
  doc.color = doc.primaryColor || doc.color || 'unknown'
  doc.primaryColor = doc.primaryColor || doc.color || 'unknown'
  doc.colors = doc.colors?.length ? doc.colors : [doc.primaryColor, ...(doc.secondaryColors || [])].filter((color) => color && color !== 'unknown')
  doc.secondaryColors = doc.secondaryColors?.length ? doc.secondaryColors : doc.colors.slice(1)
  doc.fitType = doc.fitType || doc.fit || 'regular'
  doc.fit = doc.fit || doc.fitType || 'regular'
  doc.isFavorite = Boolean(doc.isFavorite || doc.favorite)
  doc.favorite = Boolean(doc.favorite || doc.isFavorite)
  doc.usageCount = Math.max(Number(doc.usageCount || 0), Number(doc.wearCount || 0))
  doc.wearCount = Math.max(Number(doc.wearCount || 0), Number(doc.usageCount || 0))
  next()
})

export default (mongoose.models.Clothing as mongoose.Model<IClothing>) || mongoose.model<IClothing>('Clothing', ClothingSchema)
