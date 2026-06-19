import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  userId: string
  type: 'style' | 'social' | 'calendar' | 'billing' | 'feedback' | 'update'
  title: string
  body: string
  read: boolean
}

const NotificationSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['style', 'social', 'calendar', 'billing', 'feedback', 'update'], default: 'style' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true })

export default (mongoose.models.Notification as mongoose.Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema)
