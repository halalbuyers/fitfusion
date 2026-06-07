import mongoose, { Schema, Document } from 'mongoose'

export type PostType = 'image' | 'carousel' | 'video' | 'outfit' | 'wardrobe' | 'style-tip' | 'discussion' | 'poll' | 'before-after'
export type Visibility = 'public' | 'followers' | 'private'
export type PostStatus = 'published' | 'draft' | 'archived'

export interface IPost extends Document {
  userId: string
  author: {
    id: string
    name: string
    avatar?: string
    handle?: string
  }
  type: PostType
  title?: string
  caption: string
  hashtags: string[]
  tags: string[]
  location: string
  occasion: string
  style: string
  season: string
  visibility: Visibility
  status: PostStatus
  pinned: boolean
  hidden: boolean
  commentsEnabled: boolean
  likesEnabled: boolean
  images: string[]
  videoUrl?: string
  videoThumbnail?: string
  outfit?: mongoose.Types.ObjectId
  likes: string[]
  saves: string[]
  metrics: {
    views: number
    shares: number
    comments: number
  }
  poll?: {
    question?: string
    options: Array<{ label: string; votes: number }>
  }
}

const PostSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    handle: { type: String, default: '' }
  },
  type: { type: String, enum: ['image', 'carousel', 'video', 'outfit', 'wardrobe', 'style-tip', 'discussion', 'poll', 'before-after'], default: 'image' },
  title: { type: String, default: '' },
  caption: { type: String, default: '' },
  hashtags: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  location: { type: String, default: '' },
  occasion: { type: String, default: '' },
  style: { type: String, default: '' },
  season: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
  pinned: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  commentsEnabled: { type: Boolean, default: true },
  likesEnabled: { type: Boolean, default: true },
  images: { type: [String], default: [] },
  videoUrl: { type: String, default: '' },
  videoThumbnail: { type: String, default: '' },
  outfit: { type: Schema.Types.ObjectId, ref: 'Outfit' },
  likes: { type: [String], default: [] },
  saves: { type: [String], default: [] },
  metrics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  poll: {
    question: { type: String, default: '' },
    options: {
      type: [
        {
          label: { type: String, default: '' },
          votes: { type: Number, default: 0 }
        }
      ],
      default: []
    }
  }
}, { timestamps: true })

export default (mongoose.models.Post as mongoose.Model<IPost>) || mongoose.model<IPost>('Post', PostSchema)
