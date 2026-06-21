import mongoose from 'mongoose'

console.log('Connecting to MongoDB...')

let connectionRetries = 0
const MAX_RETRIES = 5

export async function connectDB() {
  try {
    // Read environment variable at runtime
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quingo'
    console.log('Connection string (first 50 chars):', MONGODB_URI.substring(0, 50) + '...')
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    })
    console.log('✅ MongoDB connected successfully')
    connectionRetries = 0 // Reset on success
  } catch (error) {
    connectionRetries++
    console.error(`❌ MongoDB connection error (attempt ${connectionRetries}/${MAX_RETRIES}):`, error)
    
    if (connectionRetries < MAX_RETRIES) {
      console.log(`Retrying in 5 seconds...`)
      setTimeout(() => {
        connectDB()
      }, 5000)
    } else {
      console.error('Max retries reached. Server shutting down.')
      process.exit(1)
    }
  }
}

export default mongoose
