import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/database.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import customerRoutes from './routes/customers.js'
import customerAuthRoutes from './routes/customerAuth.js'
import addressRoutes from './routes/addresses.js'
import categoryRoutes from './routes/categories.js'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/uploads.js'
import paymentRoutes from './routes/payments.js'
import { authMiddleware } from './middleware/auth.js'

// Load environment variables from .env file in server directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
console.log('Loading environment from:', path.resolve(__dirname, '../.env'))
dotenv.config({ path: path.resolve(__dirname, '../.env') })
console.log('Environment variables loaded')

const app: Express = express()
const PORT = process.env.PORT || 3000
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean) as string[]

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    const isAllowedOrigin = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.render.com')

    if (isAllowedOrigin) {
      return callback(null, true)
    }

    return callback(new Error(`Origin not allowed: ${origin}`), false)
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/customer/auth', customerAuthRoutes)
app.use('/api', uploadRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/categories', categoryRoutes)

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
async function startServer() {
  // Start Express server first
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV}`)
  })
  
  // Try to connect to MongoDB (will retry automatically)
  connectDB()
}

startServer()
