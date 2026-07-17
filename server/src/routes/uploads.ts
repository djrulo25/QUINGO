import { Router, Request, Response } from 'express'
import multer from 'multer'
import type { FileFilterCallback } from 'multer'
import type { Request as ExpressRequest } from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const cloudinaryPrefix = (process.env.CLOUDINARY_FOLDER || 'quingo').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()

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
  fileFilter: (req: ExpressRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos de imagen'))
    }
  }
})

const documentUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req: ExpressRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Solo se permiten archivos PDF, DOC o DOCX'))
  }
})

const uploadToCloudinary = (file: Express.Multer.File, folder = `${cloudinaryPrefix}-products`) => new Promise<any>((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder, resource_type: 'image' },
    (error, result) => error ? reject(error) : resolve(result)
  )
  Readable.from(file.buffer).pipe(uploadStream)
})

const uploadDocumentToCloudinary = (file: Express.Multer.File) => new Promise<any>((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: `${cloudinaryPrefix}-documents`, resource_type: 'raw', public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}` },
    (error, result) => error ? reject(error) : resolve(result)
  )
  Readable.from(file.buffer).pipe(uploadStream)
})

// POST /api/uploads - Upload image to Cloudinary
router.post('/uploads', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const result = await uploadToCloudinary(req.file)

    res.json(result)
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      error: error.message || 'Error al subir la imagen' 
    })
  }
})

router.post('/uploads/branding', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen' })
    const result = await uploadToCloudinary(req.file, `${cloudinaryPrefix}-branding`)
    res.status(201).json({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudo subir el logotipo' })
  }
})

// POST /api/uploads/multiple - Upload a product gallery to Cloudinary
router.post('/uploads/multiple', authMiddleware, upload.array('images'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined
    if (!files?.length) {
      return res.status(400).json({ error: 'No se recibieron imágenes' })
    }

    const results = await Promise.all(files.map((file) => uploadToCloudinary(file)))
    res.status(201).json({
      images: results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      }))
    })
  } catch (error: any) {
    console.error('Multiple upload error:', error)
    res.status(500).json({ error: error.message || 'Error al subir las imágenes' })
  }
})

// POST /api/uploads/document - Upload a product document to Cloudinary
router.post('/uploads/document', authMiddleware, documentUpload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún documento' })
    const result = await uploadDocumentToCloudinary(req.file)
    res.status(201).json({ name: req.file.originalname, url: result.secure_url, publicId: result.public_id })
  } catch (error: any) {
    console.error('Document upload error:', error)
    res.status(500).json({ error: error.message || 'Error al subir el documento' })
  }
})

export default router
