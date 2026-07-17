import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Customer from '../models/Customer.js'
import { connectDB } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function createTestCustomer() {
  try {
    const email = process.env.TEST_CUSTOMER_EMAIL
    const password = process.env.TEST_CUSTOMER_PASSWORD
    if (!email || !password) {
      throw new Error('TEST_CUSTOMER_EMAIL and TEST_CUSTOMER_PASSWORD are required')
    }

    await connectDB()
    console.log('Connected to MongoDB')

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email })
    if (existingCustomer) {
      console.log('✓ Test customer already exists')
      return
    }

    // Create test customer
    const customer = new Customer({
      email,
      password,
      firstName: 'Cliente',
      lastName: 'Prueba',
      phone: '+52 5555555555',
      addresses: [
        {
          label: 'home',
          firstName: 'Cliente',
          lastName: 'Prueba',
          phone: '+52 5555555555',
          street: 'Avenida Principal',
          number: '123',
          complement: 'Apto 5A',
          city: 'Mexico',
          state: 'CDMX',
          zipCode: '06500',
          country: 'Mexico',
          isDefault: true,
        },
      ],
    })

    await customer.save()

    console.log('✓ Test customer created successfully!')
    console.log('Test customer created from environment variables.')
  } catch (error) {
    console.error('Error creating test customer:', error)
  } finally {
    process.exit(0)
  }
}

createTestCustomer()
