import mongoose, { Schema, Document } from 'mongoose'

export type PreferenceType = 'color' | 'style' | 'category' | 'season' | 'occasion' | 'structure' | 'stylist'

export interface IPersonalizationSignal extends Document {
  userId: string
  preferenceType: PreferenceType
  value: string
  score: number
}

const PersonalizationSignalSchema = new Schema({
  userId: { type: String, required: true, index: true },
  preferenceType: { type: String, enum: ['color', 'style', 'category', 'season', 'occasion', 'structure', 'stylist'], required: true, index: true },
  value: { type: String, required: true, trim: true, lowercase: true },
  score: { type: Number, default: 0, index: true }
}, { timestamps: true })

PersonalizationSignalSchema.index({ userId: 1, preferenceType: 1, value: 1 }, { unique: true })

export default (mongoose.models.PersonalizationSignal as mongoose.Model<IPersonalizationSignal>) ||
  mongoose.model<IPersonalizationSignal>('PersonalizationSignal', PersonalizationSignalSchema)
