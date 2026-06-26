import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminSetting extends Document {
  enableAiStylist: boolean
  enableOutfitGenerator: boolean
  maintenanceMode: boolean
  registrationEnabled: boolean
  monetizationMode: 'disabled' | 'enabled'
  updatedBy?: string
}

const AdminSettingSchema = new Schema({
  enableAiStylist: { type: Boolean, default: true },
  enableOutfitGenerator: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  registrationEnabled: { type: Boolean, default: true },
  monetizationMode: { type: String, enum: ['disabled', 'enabled'], default: 'disabled' },
  updatedBy: { type: String }
}, { timestamps: true })

export default (mongoose.models.AdminSetting as mongoose.Model<IAdminSetting>) ||
  mongoose.model<IAdminSetting>('AdminSetting', AdminSettingSchema)
