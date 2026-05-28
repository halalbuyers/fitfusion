import mongoose, { Schema, Document } from 'mongoose'

export interface IPost extends Document {
  userId: string
  outfit?: mongoose.Types.ObjectId
  caption: string
  images: string[]
  likes: string[]
  saves: string[]
  tags: string[]
}

const PostSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  outfit: { type: Schema.Types.ObjectId, ref: 'Outfit' },
  caption: { type: String, default: '' },
  images: { type: [String], default: [] },
  likes: { type: [String], default: [] },
  saves: { type: [String], default: [] },
  tags: { type: [String], default: [] }
}, { timestamps: true })

export default (mongoose.models.Post as mongoose.Model<IPost>) || mongoose.model<IPost>('Post', PostSchema)
