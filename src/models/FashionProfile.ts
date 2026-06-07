import mongoose, { Schema, Document } from 'mongoose'

export interface IFashionProfile extends Document {
  userId: string
  hasCompletedOnboarding: boolean
  fashionType: 'menswear' | 'womenswear' | 'both' | 'prefer-not-to-specify'
  preferredStyles: string[]
  preferredCategories: string[]
  favoriteColors: string[]
  dislikedColors: string[]
  preferredOccasions: string[]
  climatePreference: string
  fashionGoals: string[]
  createdAt: Date
  updatedAt: Date
}

const FashionProfileSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false
    },
    fashionType: {
      type: String,
      enum: ['menswear', 'womenswear', 'both', 'prefer-not-to-specify'],
      required: true
    },
    preferredStyles: {
      type: [String],
      default: []
    },
    preferredCategories: {
      type: [String],
      default: []
    },
    favoriteColors: {
      type: [String],
      default: []
    },
    dislikedColors: {
      type: [String],
      default: []
    },
    preferredOccasions: {
      type: [String],
      default: []
    },
    climatePreference: {
      type: String,
      default: ''
    },
    fashionGoals: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
FashionProfileSchema.index({ userId: 1 })
FashionProfileSchema.index({ fashionType: 1 })
FashionProfileSchema.index({ preferredStyles: 1 })

export default mongoose.models.FashionProfile || mongoose.model<IFashionProfile>('FashionProfile', FashionProfileSchema)
