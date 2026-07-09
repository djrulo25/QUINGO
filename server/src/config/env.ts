import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../.env')

const result = dotenv.config({ path: envPath })
if (result.error) {
  const fallbackPath = path.resolve(process.cwd(), '.env')
  const fallback = dotenv.config({ path: fallbackPath })
  if (!fallback.error) {
    console.log('Loaded environment variables from fallback', fallbackPath)
  } else {
    console.warn('Could not load environment variables from', envPath, 'or', fallbackPath, fallback.error.message)
  }
} else {
  console.log('Loaded environment variables from', envPath)
}

export default result
