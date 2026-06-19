import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminFeedback extends Document {
  userId?: string
  username?: string
  name?: string
  email?: string
  profileImage?: string
  type: 'feedback' | 'bug' | 'feature'
  category?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed' | 'published' | 'rejected' | 'open' | 'resolved' | 'archived'
  title: string
  message: string
  reply?: string
  adminNotes?: string
  assignedTo?: string
  convertedUpdateId?: string
  createdAt: Date
}

const AdminFeedbackSchema = new Schema({
  userId: { type: String, index: true },
  username: { type: String, trim: true, index: true },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  profileImage: { type: String, trim: true },
  type: { type: String, enum: ['feedback', 'bug', 'feature'], default: 'feedback', index: true },
  category: { type: String, trim: true, default: 'feedback', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
  status: { type: String, enum: ['pending', 'completed', 'published', 'rejected', 'open', 'resolved', 'archived'], default: 'pending', index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  reply: { type: String, trim: true },
  adminNotes: { type: String, trim: true },
  assignedTo: { type: String, trim: true },
  convertedUpdateId: { type: String, index: true }
}, { timestamps: true })

AdminFeedbackSchema.index({ status: 1, createdAt: -1 })

export default (mongoose.models.AdminFeedback as mongoose.Model<IAdminFeedback>) ||
  mongoose.model<IAdminFeedback>('AdminFeedback', AdminFeedbackSchema)
