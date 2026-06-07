import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  clerkId?: string
  name: string
  email: string
  passwordHash?: string
  profilePhoto?: string
  coverPhoto?: string
  bio?: string
  website?: string
  age?: number
  gender?: string
  styleType?: string
  favoriteBrands?: string[]
  stylePreferences?: string[]
  favoriteColors?: string[]
  sizes?: Record<string, string>
  followers?: string[]
  following?: string[]
  savedOutfits?: mongoose.Types.ObjectId[]
  role: 'user' | 'moderator' | 'admin'
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  profilePhoto: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  bio: { type: String, default: '' },
  website: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String },
  styleType: { type: String, default: '' },
  favoriteBrands: { type: [String], default: [] },
  stylePreferences: { type: [String], default: [] },
  favoriteColors: { type: [String], default: [] },
  sizes: { type: Schema.Types.Mixed, default: {} },
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  savedOutfits: { type: [Schema.Types.ObjectId], ref: 'Outfit', default: [] },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user', index: true }
}, { timestamps: true })

export default (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema)
