import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../../.env')

const shouldLoadEnv = !process.env.SENDGRID_API_KEY && !process.env.EMAIL_FROM && !process.env.MONGODB_URI

const result = shouldLoadEnv
  ? dotenv.config({ path: envPath })
  : undefined

if (shouldLoadEnv && result?.error) {
  const fallbackPath = path.resolve(process.cwd(), '.env')
  const fallback = dotenv.config({ path: fallbackPath })
  if (!fallback.error) {
    console.log('Loaded environment variables from fallback', fallbackPath)
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn('Could not load environment variables from', envPath, 'or', fallbackPath, fallback.error.message)
  }
} else if (shouldLoadEnv) {
  console.log('Loaded environment variables from', envPath)
} else if (process.env.NODE_ENV !== 'production') {
  console.log('Environment variables already set; skipping .env load')
}

export default result
