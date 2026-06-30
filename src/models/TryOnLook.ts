import mongoose, { Schema, Document } from 'mongoose'

export type TryOnRenderStatus = 'queued' | 'rendering' | 'complete' | 'failed'

export interface ITryOnLook extends Document {
  userId: string
  avatarId: mongoose.Types.ObjectId
  cacheKey: string
  title: string
  occasion: string
  outfitKey?: string
  outfitSnapshot: Record<string, any>
  settings: Record<string, any>
  originalImageUrl: string
  previewUrl?: string
  layerPlan: Array<Record<string, any>>
  scores: Record<string, any>
  suggestions: Array<Record<string, any>>
  photoStudio?: Record<string, any>
  comparisonSummary?: string
  favorite: boolean
  status: TryOnRenderStatus
  error?: string
  createdAt: Date
  updatedAt: Date
}

const TryOnLookSchema = new Schema({
  userId: { type: String, required: true, index: true },
  avatarId: { type: Schema.Types.ObjectId, ref: 'TryOnAvatar', required: true, index: true },
  cacheKey: { type: String, required: true, index: true },
  title: { type: String, default: 'Try-on look' },
  occasion: { type: String, default: 'casual', index: true },
  outfitKey: { type: String, index: true },
  outfitSnapshot: { type: Schema.Types.Mixed, default: {} },
  settings: { type: Schema.Types.Mixed, default: {} },
  originalImageUrl: { type: String, required: true },
  previewUrl: { type: String },
  layerPlan: { type: [Schema.Types.Mixed], default: [] },
  scores: { type: Schema.Types.Mixed, default: {} },
  suggestions: { type: [Schema.Types.Mixed], default: [] },
  photoStudio: { type: Schema.Types.Mixed, default: undefined },
  comparisonSummary: { type: String },
  favorite: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['queued', 'rendering', 'complete', 'failed'], default: 'complete', index: true },
  error: { type: String }
}, { timestamps: true })

TryOnLookSchema.index({ userId: 1, cacheKey: 1 }, { unique: true })
TryOnLookSchema.index({ userId: 1, updatedAt: -1 })

export default (mongoose.models.TryOnLook as mongoose.Model<ITryOnLook>) ||
  mongoose.model<ITryOnLook>('TryOnLook', TryOnLookSchema)
