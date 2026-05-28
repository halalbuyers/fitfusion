import mongoose, { Schema, Document } from 'mongoose'

export interface IOutfit extends Document {
  userId: string
  title: string
  occasion: string
  items: { clothing: mongoose.Types.ObjectId; role?: string }[]
  score: number
  explanation?: string
  colorAnalysis?: string
  breakdown?: Record<string, number>
  tags: string[]
  isFavorite: boolean
  plannedFor?: Date
  createdAt: Date
}

const OutfitSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  occasion: { type: String, default: 'casual' },
  items: [{ clothing: { type: Schema.Types.ObjectId, ref: 'Clothing' }, role: String }],
  score: { type: Number, default: 0 },
  explanation: { type: String },
  colorAnalysis: { type: String },
  breakdown: { type: Schema.Types.Mixed, default: {} },
  tags: { type: [String], default: [] },
  isFavorite: { type: Boolean, default: false, index: true },
  plannedFor: { type: Date }
}, { timestamps: true })

export default (mongoose.models.Outfit as mongoose.Model<IOutfit>) || mongoose.model<IOutfit>('Outfit', OutfitSchema)
