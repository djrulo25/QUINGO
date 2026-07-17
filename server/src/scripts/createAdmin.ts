import mongoose from 'mongoose'
import Admin from '../models/Admin.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables')
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    const adminCount = await Admin.countDocuments()
    if (adminCount > 0) {
      console.log('❌ Admin already exists!')
      process.exit(0)
    }

    const email = process.env.INITIAL_ADMIN_EMAIL
    const password = process.env.INITIAL_ADMIN_PASSWORD
    if (!email || !password) throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required')
    const admin = new Admin({
      email,
      password,
      name: 'Administrador',
      role: 'super_admin',
    })

    await admin.save()
    console.log('✅ Admin created successfully!')
    console.log('Admin created from environment variables. Change the password after first login.')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()
