import mongoose, { Schema, Document } from 'mongoose'

export type OutfitInteractionAction = 'liked' | 'saved' | 'rejected' | 'worn' | 'favorited'

export interface IOutfitInteraction extends Document {
  userId: string
  outfitId?: mongoose.Types.ObjectId
  outfitKey?: string
  action: OutfitInteractionAction
  createdAt: Date
}

const OutfitInteractionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  outfitId: { type: Schema.Types.ObjectId, ref: 'Outfit', index: true },
  outfitKey: { type: String, index: true },
  action: { type: String, enum: ['liked', 'saved', 'rejected', 'worn', 'favorited'], required: true, index: true }
}, { timestamps: true })

OutfitInteractionSchema.index({ userId: 1, createdAt: -1 })
OutfitInteractionSchema.index({ userId: 1, outfitKey: 1, action: 1 })

export default (mongoose.models.OutfitInteraction as mongoose.Model<IOutfitInteraction>) ||
  mongoose.model<IOutfitInteraction>('OutfitInteraction', OutfitInteractionSchema)
