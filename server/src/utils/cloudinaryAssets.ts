import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function deleteCloudinaryAsset(url?: string) {
  if (!url) return
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('cloudinary.com') || !parsed.pathname.includes('/upload/')) return
    const [prefix, tailValue] = parsed.pathname.split('/upload/')
    const resourceType = prefix.includes('/raw/') ? 'raw' : 'image'
    let publicId = decodeURIComponent(tailValue).replace(/^v\d+\//, '')
    if (resourceType === 'image') publicId = publicId.replace(/\.[^.]+$/, '')
    if (!publicId.startsWith('quingo-products/') && !publicId.startsWith('quingo-documents/')) return
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (error) {
    console.error('Cloudinary cleanup error:', error)
  }
}
