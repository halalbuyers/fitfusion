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
  outfitKey?: string
  confidence?: number
  confidenceLabel?: string
  weatherMatch?: Record<string, any>
  missingEssentials?: Array<Record<string, any>>
  method?: string
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
  outfitKey: { type: String, index: true },
  confidence: { type: Number, default: 0 },
  confidenceLabel: { type: String },
  weatherMatch: { type: Schema.Types.Mixed, default: undefined },
  missingEssentials: { type: [Schema.Types.Mixed], default: undefined },
  method: { type: String, default: 'local' },
  isFavorite: { type: Boolean, default: false, index: true },
  plannedFor: { type: Date }
}, { timestamps: true })

OutfitSchema.index({ userId: 1, outfitKey: 1 })
OutfitSchema.index({ userId: 1, score: -1 })

export default (mongoose.models.Outfit as mongoose.Model<IOutfit>) || mongoose.model<IOutfit>('Outfit', OutfitSchema)
