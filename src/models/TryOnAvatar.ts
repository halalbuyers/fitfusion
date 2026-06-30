import mongoose, { Schema, Document } from 'mongoose'

export type TryOnAvatarSource = 'selfie' | 'full-body' | 'ai'

export interface ITryOnAvatar extends Document {
  userId: string
  name: string
  sourceType: TryOnAvatarSource
  imageUrl: string
  publicId?: string
  bodyAnalysis: Record<string, any>
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const TryOnAvatarSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, default: 'My avatar' },
  sourceType: { type: String, enum: ['selfie', 'full-body', 'ai'], default: 'full-body', index: true },
  imageUrl: { type: String, required: true },
  publicId: { type: String },
  bodyAnalysis: { type: Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true })

TryOnAvatarSchema.index({ userId: 1, active: 1, updatedAt: -1 })

export default (mongoose.models.TryOnAvatar as mongoose.Model<ITryOnAvatar>) ||
  mongoose.model<ITryOnAvatar>('TryOnAvatar', TryOnAvatarSchema)
