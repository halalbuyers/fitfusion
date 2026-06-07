import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminAnnouncement extends Document {
  title: string
  body: string
  description?: string
  type: 'announcement' | 'maintenance' | 'feature' | 'update' | 'fix'
  status: 'draft' | 'published' | 'archived'
  audience: 'all' | 'users' | 'admins'
  suggestedByUserId?: string
  suggestedByUsername?: string
  isActive: boolean
  featured: boolean
  priority: number
  displayOrder: number
  startsAt?: Date
  endsAt?: Date
  createdBy?: string
  createdAt: Date
}

const AdminAnnouncementSchema = new Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  type: { type: String, enum: ['announcement', 'maintenance', 'feature', 'update', 'fix'], default: 'update', index: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  audience: { type: String, enum: ['all', 'users', 'admins'], default: 'all' },
  suggestedByUserId: { type: String },
  suggestedByUsername: { type: String },
  isActive: { type: Boolean, default: true, index: true },
  featured: { type: Boolean, default: false, index: true },
  priority: { type: Number, default: 0, index: true },
  displayOrder: { type: Number, default: 0, index: true },
  startsAt: { type: Date },
  endsAt: { type: Date },
  createdBy: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

AdminAnnouncementSchema.virtual('description').get(function (this: any) {
  return this.body
})

AdminAnnouncementSchema.index({ status: 1, featured: -1, displayOrder: 1, priority: -1, createdAt: -1 })

export default (mongoose.models.AdminAnnouncement as mongoose.Model<IAdminAnnouncement>) ||
  mongoose.model<IAdminAnnouncement>('AdminAnnouncement', AdminAnnouncementSchema)
