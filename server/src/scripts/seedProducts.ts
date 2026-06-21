import mongoose from 'mongoose'
import Product from '../models/Product.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const products = [
  {
    name: 'Electrodo MMA 6010',
    description: 'Electrodo de soldadura MMA 6010 para acero dulce, amplia penetración',
    price: 450,
    originalPrice: 500,
    image: 'https://via.placeholder.com/300x300?text=Electrodo+6010',
    category: 'welding',
    subcategory: 'Electrodos',
    stock: 100,
    rating: 4.5,
    reviews: 12,
    sku: 'ELC-6010-001',
    specifications: {
      'Tipo': 'Rutílico',
      'Diámetro': '3.25mm',
      'Rendimiento': '85%'
    }
  },
  {
    name: 'Casco de Soldadura Automático',
    description: 'Casco de soldar con pantalla automática de luz ajustable',
    price: 1200,
    originalPrice: 1500,
    image: 'https://via.placeholder.com/300x300?text=Casco+Soldadura',
    category: 'welding',
    subcategory: 'Equipo de protección',
    stock: 25,
    rating: 4.8,
    reviews: 34,
    sku: 'CSC-AUTO-001',
    specifications: {
      'Tipo': 'Automático',
      'Tiempo de respuesta': '0.1ms',
      'Rango de oscuridad': '4-13'
    }
  },
  {
    name: 'Guantes de Seguridad Cuero',
    description: 'Guantes de cuero de vaca para manipuleo de metales calientes',
    price: 280,
    image: 'https://via.placeholder.com/300x300?text=Guantes+Cuero',
    category: 'safety',
    subcategory: 'Guantes',
    stock: 150,
    rating: 4.3,
    reviews: 25,
    sku: 'GLV-LEATHER-001',
    specifications: {
      'Material': 'Cuero vacuno',
      'Tamaño': 'Único',
      'Temperatura': 'Hasta 500°C'
    }
  },
  {
    name: 'Lentes de Seguridad Transparentes',
    description: 'Lentes de seguridad con marcos ajustables y protección UV',
    price: 150,
    image: 'https://via.placeholder.com/300x300?text=Lentes+Seguridad',
    category: 'safety',
    subcategory: 'Lentes',
    stock: 200,
    rating: 4.2,
    reviews: 18,
    sku: 'LEN-TRANS-001',
    specifications: {
      'Material del marco': 'Plástico ABS',
      'Protección UV': 'Sí',
      'Certificado': 'ANSI Z87.1'
    }
  },
  {
    name: 'Regulador de Presión Oxígeno',
    description: 'Regulador de presión para tanques de oxígeno con manómetro dual',
    price: 850,
    originalPrice: 1000,
    image: 'https://via.placeholder.com/300x300?text=Regulador+Oxigeno',
    category: 'gases',
    subcategory: 'Reguladores',
    stock: 40,
    rating: 4.7,
    reviews: 22,
    sku: 'REG-OXI-001',
    specifications: {
      'Presión máxima': '4000 PSI',
      'Salida': '0-500 PSI',
      'Conexión': 'CGA-540'
    }
  },
  {
    name: 'Manguera Acetileno 6m',
    description: 'Manguera de acetileno de alta resistencia, certificada para uso industrial',
    price: 320,
    image: 'https://via.placeholder.com/300x300?text=Manguera+Acetileno',
    category: 'gases',
    subcategory: 'Mangueras',
    stock: 80,
    rating: 4.4,
    reviews: 16,
    sku: 'MNG-ACT-006',
    specifications: {
      'Longitud': '6 metros',
      'Diámetro': '3/8 pulgadas',
      'Presión de trabajo': '30 Bar'
    }
  },
  {
    name: 'Máquina Soldadora MIG 200A',
    description: 'Soldadora MIG semiautomática 200A, ideal para trabajos medianos y pequeños',
    price: 3500,
    originalPrice: 4000,
    image: 'https://via.placeholder.com/300x300?text=Soldadora+MIG+200A',
    category: 'welding',
    subcategory: 'Máquinas',
    stock: 12,
    rating: 4.9,
    reviews: 45,
    sku: 'WLD-MIG-200',
    specifications: {
      'Amperaje': '20-200A',
      'Voltaje': '115/230V',
      'Ciclo': '60%'
    }
  },
  {
    name: 'Arnés de Seguridad',
    description: 'Arnés de seguridad para trabajos en altura, conforme a normas OSHA',
    price: 420,
    image: 'https://via.placeholder.com/300x300?text=Arnes+Seguridad',
    category: 'safety',
    subcategory: 'Arneses',
    stock: 60,
    rating: 4.6,
    reviews: 28,
    sku: 'ARN-HEIGHT-001',
    specifications: {
      'Capacidad de carga': '140 kg',
      'Material': 'Nylon y acero',
      'Certificación': 'OSHA 1926.500'
    }
  }
]

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables')
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Clear existing products
    await Product.deleteMany({})
    console.log('🗑️ Cleared existing products')

    // Insert new products
    const result = await Product.insertMany(products)
    console.log(`✅ Inserted ${result.length} products`)

    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
