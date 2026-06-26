import mongoose, { Schema, Document } from 'mongoose'

export type CalendarOutfitStatus = 'planned' | 'worn' | 'skipped'

export interface ICalendarOutfit extends Document {
  userId: string
  date: Date
  outfitId: mongoose.Types.ObjectId
  occasion: string
  weather?: {
    temperature?: number
    condition?: string
    suggestion?: string
    source?: string
  }
  notes?: string
  status: CalendarOutfitStatus
  createdAt: Date
}

const CalendarOutfitSchema = new Schema({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  outfitId: { type: Schema.Types.ObjectId, ref: 'Outfit', required: true, index: true },
  occasion: { type: String, default: 'casual', index: true },
  weather: {
    temperature: Number,
    condition: String,
    suggestion: String,
    source: String
  },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['planned', 'worn', 'skipped'], default: 'planned', index: true }
}, { timestamps: true })

CalendarOutfitSchema.index({ userId: 1, date: 1 })
CalendarOutfitSchema.index({ userId: 1, status: 1, date: -1 })

export default (mongoose.models.CalendarOutfit as mongoose.Model<ICalendarOutfit>) ||
  mongoose.model<ICalendarOutfit>('CalendarOutfit', CalendarOutfitSchema)
