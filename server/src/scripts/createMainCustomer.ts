import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Customer from '../models/Customer.js'
import { connectDB } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function createOrUpdateCustomer() {
  try {
    await connectDB()
    console.log('Connected to MongoDB')

    const email = 'raulf25@gmail.com'
    const password = 'mividaoscar1403'

    // Check if customer exists
    let customer = await Customer.findOne({ email })
    
    if (customer) {
      console.log('✓ Customer found, updating password...')
      customer.password = password
      await customer.save()
      console.log('✓ Password updated successfully!')
    } else {
      console.log('Creating new customer...')
      // Create new customer
      customer = new Customer({
        email,
        password,
        firstName: 'Raul',
        lastName: 'Flores',
        phone: '+52 5555555555',
        addresses: [
          {
            label: 'home',
            firstName: 'Raul',
            lastName: 'Flores',
            phone: '+52 5555555555',
            street: 'Avenida Principal',
            number: '123',
            complement: 'Apto 1',
            city: 'Mexico',
            state: 'CDMX',
            zipCode: '06500',
            country: 'Mexico',
            isDefault: true,
          },
        ],
      })

      await customer.save()
      console.log('✓ Customer created successfully!')
    }

    console.log('')
    console.log('═══════════════════════════════════')
    console.log('Customer credentials:')
    console.log('  Email: raulf25@gmail.com')
    console.log('  Password: mividaoscar1403')
    console.log('═══════════════════════════════════')
    console.log('')
    console.log('You can now login at:')
    console.log('  http://localhost:5173/customer/login')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

createOrUpdateCustomer()
