import mongoose, { Schema, Document } from 'mongoose'

export interface IUserPreference extends Document {
  userId: string
  preferredStyles: string[]
  preferredColors: string[]
  avoidedColors: string[]
  favoriteCategories: string[]
  rejectedOutfitKeys: string[]
  favoriteOutfitKeys: string[]
}

const UserPreferenceSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  preferredStyles: { type: [String], default: [] },
  preferredColors: { type: [String], default: [] },
  avoidedColors: { type: [String], default: [] },
  favoriteCategories: { type: [String], default: [] },
  rejectedOutfitKeys: { type: [String], default: [] },
  favoriteOutfitKeys: { type: [String], default: [] }
}, { timestamps: true })

export default (mongoose.models.UserPreference as mongoose.Model<IUserPreference>) || mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema)
