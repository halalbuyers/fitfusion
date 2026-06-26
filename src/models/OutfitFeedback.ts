import mongoose, { Schema, Document } from 'mongoose'

export type OutfitFeedbackReaction = 'love_it' | 'not_my_style' | 'wear_again' | 'never_suggest_again'

export interface IOutfitFeedback extends Document {
  userId: string
  outfitKey: string
  reaction: OutfitFeedbackReaction
  colors: string[]
  categories: string[]
  style: string
  season: string
  occasion: string
  createdAt: Date
}

const OutfitFeedbackSchema = new Schema({
  userId: { type: String, required: true, index: true },
  outfitKey: { type: String, required: true, index: true },
  reaction: {
    type: String,
    enum: ['love_it', 'not_my_style', 'wear_again', 'never_suggest_again'],
    required: true,
    index: true
  },
  colors: { type: [String], default: [] },
  categories: { type: [String], default: [] },
  style: { type: String, default: '' },
  season: { type: String, default: '' },
  occasion: { type: String, default: 'casual', index: true }
}, { timestamps: true })

OutfitFeedbackSchema.index({ userId: 1, createdAt: -1 })
OutfitFeedbackSchema.index({ userId: 1, outfitKey: 1, reaction: 1 })

export default (mongoose.models.OutfitFeedback as mongoose.Model<IOutfitFeedback>) ||
  mongoose.model<IOutfitFeedback>('OutfitFeedback', OutfitFeedbackSchema)
