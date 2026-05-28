import mongoose, { Schema, Document } from 'mongoose'

export interface IComment extends Document {
  userId: string
  post: mongoose.Types.ObjectId
  body: string
}

const CommentSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  body: { type: String, required: true, maxlength: 500 }
}, { timestamps: true })

export default (mongoose.models.Comment as mongoose.Model<IComment>) || mongoose.model<IComment>('Comment', CommentSchema)
