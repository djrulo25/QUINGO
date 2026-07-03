import 'dotenv/config'
import mongoose from 'mongoose'
import Order from './src/models/Order.js'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quingo'

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 5000 })
  const order = await Order.findOne({ orderNumber: 'ORD-1783104424359' }).lean()
  console.log(JSON.stringify(order, null, 2))
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  await mongoose.disconnect().catch(() => {})
}
