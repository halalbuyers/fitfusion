import mongoose, { Schema, Document } from 'mongoose'

export interface ISavedOutfit extends Document {
  userId: string
  outfit: mongoose.Types.ObjectId
  notes?: string
  plannedFor?: Date
}

const SavedOutfitSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  outfit: { type: Schema.Types.ObjectId, ref: 'Outfit', required: true },
  notes: String,
  plannedFor: { type: Date, index: true }
}, { timestamps: true })

export default (mongoose.models.SavedOutfit as mongoose.Model<ISavedOutfit>) || mongoose.model<ISavedOutfit>('SavedOutfit', SavedOutfitSchema)
