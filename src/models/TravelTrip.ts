import mongoose, { Schema, Document } from 'mongoose'

export type TravelTripStatus = 'active' | 'archived'

export interface ITravelTrip extends Document {
  userId: string
  destination: string
  startDate: Date
  endDate: Date
  purpose: string
  activities: string[]
  transportation: string
  travelStyle: string
  status: TravelTripStatus
  plan: Record<string, any>
  checklist: Array<{ id: string; label: string; category: string; packed: boolean; quantity?: number; reason?: string }>
  createdAt: Date
}

const TravelTripSchema = new Schema({
  userId: { type: String, required: true, index: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  purpose: { type: String, default: 'Vacation' },
  activities: { type: [String], default: [] },
  transportation: { type: String, default: '' },
  travelStyle: { type: String, default: 'vacation', index: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
  plan: { type: Schema.Types.Mixed, default: {} },
  checklist: [{
    id: String,
    label: String,
    category: String,
    packed: { type: Boolean, default: false },
    quantity: Number,
    reason: String
  }]
}, { timestamps: true })

TravelTripSchema.index({ userId: 1, status: 1, startDate: -1 })

export default (mongoose.models.TravelTrip as mongoose.Model<ITravelTrip>) ||
  mongoose.model<ITravelTrip>('TravelTrip', TravelTripSchema)

