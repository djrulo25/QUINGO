import { Router, Request, Response } from 'express'
import multer, { Multer } from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos de imagen'))
    }
  }
})

// POST /api/uploads - Upload image to Cloudinary
router.post('/uploads', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'quingo-products',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      // Convert buffer to stream and pipe to upload
      const stream = Readable.from(req.file!.buffer)
      stream.pipe(uploadStream)
    })

    res.json(result)
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      error: error.message || 'Error al subir la imagen' 
    })
  }
})

export default router
