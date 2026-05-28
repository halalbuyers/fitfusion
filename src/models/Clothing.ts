import mongoose, { Schema, Document } from 'mongoose'

export interface IClothing extends Document {
  userId: string
  image: string
  category: string
  color: string
  colors: string[]
  style: string
  season: string
  occasion: string[]
  tags: string[]
  brand?: string
  fitType?: string
  material?: string
  isFavorite: boolean
  usageCount: number
  createdAt: Date
}

const ClothingSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  color: { type: String, default: 'black' },
  colors: { type: [String], default: [] },
  style: { type: String },
  season: { type: String },
  occasion: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  brand: { type: String },
  fitType: { type: String },
  material: { type: String },
  isFavorite: { type: Boolean, default: false, index: true },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true })

export default (mongoose.models.Clothing as mongoose.Model<IClothing>) || mongoose.model<IClothing>('Clothing', ClothingSchema)
