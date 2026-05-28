import mongoose, { Schema, Document } from 'mongoose'

export interface ISubscription extends Document {
  userId: string
  plan: 'free' | 'premium' | 'studio'
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  providerId?: string
  renewsAt?: Date
}

const SubscriptionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  plan: { type: String, enum: ['free', 'premium', 'studio'], default: 'free' },
  status: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled'], default: 'active' },
  providerId: String,
  renewsAt: Date
}, { timestamps: true })

export default (mongoose.models.Subscription as mongoose.Model<ISubscription>) || mongoose.model<ISubscription>('Subscription', SubscriptionSchema)
