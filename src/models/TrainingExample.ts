import mongoose, { Schema, Document } from 'mongoose'

export interface ITrainingExample extends Document {
  userId?: string
  imageUrl: string
  aiCategory?: string
  userCategory?: string
  aiColor?: string
  userColor?: string
  aiStyle?: string
  userStyle?: string
  createdAt: Date
}

const TrainingExampleSchema = new Schema({
  userId: { type: String, index: true },
  imageUrl: { type: String, required: true },
  aiCategory: { type: String, trim: true, lowercase: true },
  userCategory: { type: String, trim: true, lowercase: true },
  aiColor: { type: String, trim: true, lowercase: true },
  userColor: { type: String, trim: true, lowercase: true },
  aiStyle: { type: String, trim: true, lowercase: true },
  userStyle: { type: String, trim: true, lowercase: true }
}, { timestamps: true })

TrainingExampleSchema.index({ createdAt: -1 })

export default (mongoose.models.TrainingExample as mongoose.Model<ITrainingExample>) ||
  mongoose.model<ITrainingExample>('TrainingExample', TrainingExampleSchema)
