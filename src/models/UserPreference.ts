import mongoose, { Schema, Document } from 'mongoose'

export interface IUserPreference extends Document {
  userId: string
  favoriteColors: string[]
  favoriteCategories: string[]
  favoriteStyles: string[]
  favoriteSeasons: string[]
  likedOutfitKeys: string[]
  rejectedOutfitKeys: string[]
  correctedCategories: Array<{ predictedCategory: string; correctedCategory: string; count: number; lastCorrectedAt?: Date }>
  correctedColors: Array<{ predictedColor: string; correctedColor: string; count: number; lastCorrectedAt?: Date }>
  preferredStyles: string[]
  preferredColors: string[]
  avoidedColors: string[]
  favoriteOccasions: string[]
  dislikedColors: string[]
  dislikedStyles: string[]
  dislikedCategories: string[]
  dislikedSeasons: string[]
  dislikedOccasions: string[]
  favoriteOutfitKeys: string[]
  favoriteItems: string[]
  rejectedItems: string[]
  overusedItems: string[]
}

const UserPreferenceSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  favoriteColors: { type: [String], default: [] },
  favoriteCategories: { type: [String], default: [] },
  favoriteStyles: { type: [String], default: [] },
  favoriteSeasons: { type: [String], default: [] },
  likedOutfitKeys: { type: [String], default: [] },
  rejectedOutfitKeys: { type: [String], default: [] },
  correctedCategories: {
    type: [{
      predictedCategory: { type: String, trim: true, lowercase: true },
      correctedCategory: { type: String, trim: true, lowercase: true },
      count: { type: Number, default: 1 },
      lastCorrectedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  correctedColors: {
    type: [{
      predictedColor: { type: String, trim: true, lowercase: true },
      correctedColor: { type: String, trim: true, lowercase: true },
      count: { type: Number, default: 1 },
      lastCorrectedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  preferredStyles: { type: [String], default: [] },
  preferredColors: { type: [String], default: [] },
  avoidedColors: { type: [String], default: [] },
  favoriteOccasions: { type: [String], default: [] },
  dislikedColors: { type: [String], default: [] },
  dislikedStyles: { type: [String], default: [] },
  dislikedCategories: { type: [String], default: [] },
  dislikedSeasons: { type: [String], default: [] },
  dislikedOccasions: { type: [String], default: [] },
  favoriteOutfitKeys: { type: [String], default: [] },
  favoriteItems: { type: [String], default: [] },
  rejectedItems: { type: [String], default: [] },
  overusedItems: { type: [String], default: [] }
}, { timestamps: true })

export default (mongoose.models.UserPreference as mongoose.Model<IUserPreference>) || mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema)
