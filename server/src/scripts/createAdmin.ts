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

    const admin = new Admin({
      email: 'admin@quingo.com',
      password: 'admin123456',
      name: 'Administrador',
      role: 'super_admin',
    })

    await admin.save()
    console.log('✅ Admin created successfully!')
    console.log('📧 Email: admin@quingo.com')
    console.log('🔑 Password: admin123456')
    console.log('⚠️  Remember to change the password after first login!')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()
