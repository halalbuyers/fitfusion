import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminFeedback extends Document {
  userId?: string
  name?: string
  email?: string
  type: 'feedback' | 'bug' | 'feature'
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'resolved' | 'archived'
  title: string
  message: string
  reply?: string
  createdAt: Date
}

const AdminFeedbackSchema = new Schema({
  userId: { type: String, index: true },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  type: { type: String, enum: ['feedback', 'bug', 'feature'], default: 'feedback', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
  status: { type: String, enum: ['open', 'resolved', 'archived'], default: 'open', index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  reply: { type: String, trim: true }
}, { timestamps: true })

AdminFeedbackSchema.index({ status: 1, createdAt: -1 })

export default (mongoose.models.AdminFeedback as mongoose.Model<IAdminFeedback>) ||
  mongoose.model<IAdminFeedback>('AdminFeedback', AdminFeedbackSchema)
