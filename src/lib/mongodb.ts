import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || ''

let cached = globalThis as any

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null }
}

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err))

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
  }

  if (cached.mongoose.conn) {
    return cached.mongoose.conn
  }

  if (!cached.mongoose.promise) {
    cached.mongoose.promise = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then((m) => m)
      .catch((error) => {
        cached.mongoose.promise = null
        throw error
      })
  }

  cached.mongoose.conn = await cached.mongoose.promise
  return cached.mongoose.conn
}
