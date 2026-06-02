import mongoose, { Schema, Document } from 'mongoose'

export type AdminActivityAction =
  | 'user_login'
  | 'user_signup'
  | 'wardrobe_upload'
  | 'outfit_generation'
  | 'role_change'
  | 'admin_action'
  | 'feedback_update'
  | 'setting_update'

export interface IAdminActivityLog extends Document {
  userId?: string
  userEmail?: string
  action: AdminActivityAction
  target?: string
  metadata?: Record<string, unknown>
  ip?: string
  createdAt: Date
}

const AdminActivityLogSchema = new Schema({
  userId: { type: String, index: true },
  userEmail: { type: String, trim: true, lowercase: true },
  action: {
    type: String,
    enum: ['user_login', 'user_signup', 'wardrobe_upload', 'outfit_generation', 'role_change', 'admin_action', 'feedback_update', 'setting_update'],
    required: true,
    index: true
  },
  target: { type: String, trim: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ip: { type: String }
}, { timestamps: true })

AdminActivityLogSchema.index({ createdAt: -1 })

export default (mongoose.models.AdminActivityLog as mongoose.Model<IAdminActivityLog>) ||
  mongoose.model<IAdminActivityLog>('AdminActivityLog', AdminActivityLogSchema)
