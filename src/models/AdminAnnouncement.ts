import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminAnnouncement extends Document {
  title: string
  body: string
  type: 'announcement' | 'maintenance' | 'feature'
  status: 'draft' | 'published' | 'archived'
  audience: 'all' | 'users' | 'admins'
  startsAt?: Date
  endsAt?: Date
  createdBy?: string
  createdAt: Date
}

const AdminAnnouncementSchema = new Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  type: { type: String, enum: ['announcement', 'maintenance', 'feature'], default: 'announcement', index: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  audience: { type: String, enum: ['all', 'users', 'admins'], default: 'all' },
  startsAt: { type: Date },
  endsAt: { type: Date },
  createdBy: { type: String }
}, { timestamps: true })

AdminAnnouncementSchema.index({ status: 1, startsAt: -1 })

export default (mongoose.models.AdminAnnouncement as mongoose.Model<IAdminAnnouncement>) ||
  mongoose.model<IAdminAnnouncement>('AdminAnnouncement', AdminAnnouncementSchema)
