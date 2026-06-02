import mongoose, { Schema, Document } from 'mongoose'

export interface IAiRequestLog extends Document {
  userId?: string
  kind: 'stylist' | 'outfit' | 'analysis'
  provider: 'gemini' | 'local' | 'hybrid'
  status: 'success' | 'failed' | 'fallback'
  responseTimeMs?: number
  createdAt: Date
}

const AiRequestLogSchema = new Schema({
  userId: { type: String, index: true },
  kind: { type: String, enum: ['stylist', 'outfit', 'analysis'], default: 'stylist', index: true },
  provider: { type: String, enum: ['gemini', 'local', 'hybrid'], default: 'local', index: true },
  status: { type: String, enum: ['success', 'failed', 'fallback'], default: 'success', index: true },
  responseTimeMs: { type: Number, default: 0 }
}, { timestamps: true })

AiRequestLogSchema.index({ createdAt: -1 })

export default (mongoose.models.AiRequestLog as mongoose.Model<IAiRequestLog>) ||
  mongoose.model<IAiRequestLog>('AiRequestLog', AiRequestLogSchema)
