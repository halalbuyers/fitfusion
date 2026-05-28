import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  clerkId?: string
  name: string
  email: string
  passwordHash?: string
  age?: number
  gender?: string
  stylePreferences?: string[]
  favoriteColors?: string[]
  sizes?: Record<string, string>
  createdAt: Date
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  age: { type: Number },
  gender: { type: String },
  stylePreferences: { type: [String], default: [] },
  favoriteColors: { type: [String], default: [] },
  sizes: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true })

export default (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema)
