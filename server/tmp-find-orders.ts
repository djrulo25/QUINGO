import 'dotenv/config'
import mongoose from 'mongoose'
import Order from './src/models/Order.js'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quingo'

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 5000 })
  const orders = await Order.find({ paymentIntentId: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber paymentMethod paymentStatus status paymentIntentId createdAt')
    .lean()
  console.log(JSON.stringify(orders, null, 2))
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
