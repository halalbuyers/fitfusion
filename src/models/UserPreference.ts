import mongoose, { Schema, Document } from 'mongoose'

export interface IUserPreference extends Document {
  userId: string
  preferredStyles: string[]
  preferredColors: string[]
  avoidedColors: string[]
  favoriteCategories: string[]
  favoriteOccasions: string[]
  dislikedColors: string[]
  dislikedStyles: string[]
  rejectedOutfitKeys: string[]
  favoriteOutfitKeys: string[]
}

const UserPreferenceSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  preferredStyles: { type: [String], default: [] },
  preferredColors: { type: [String], default: [] },
  avoidedColors: { type: [String], default: [] },
  favoriteCategories: { type: [String], default: [] },
  favoriteOccasions: { type: [String], default: [] },
  dislikedColors: { type: [String], default: [] },
  dislikedStyles: { type: [String], default: [] },
  rejectedOutfitKeys: { type: [String], default: [] },
  favoriteOutfitKeys: { type: [String], default: [] }
}, { timestamps: true })

export default (mongoose.models.UserPreference as mongoose.Model<IUserPreference>) || mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema)
