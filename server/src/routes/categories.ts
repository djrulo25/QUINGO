import { Router, Request, Response } from 'express'

const router = Router()

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = [
      {
        id: 'welding',
        name: 'Accesorios para Soldar',
        slug: 'welding',
        description: 'Equipos y accesorios para soldadura profesional',
        image: '/images/categories/welding.jpg',
        subcategories: [
          { id: 'electrodes', name: 'Electrodos', slug: 'electrodes' },
          { id: 'torches', name: 'Quemadores', slug: 'torches' },
          { id: 'accessories', name: 'Accesorios', slug: 'accessories' }
        ]
      },
      {
        id: 'safety',
        name: 'Protección Industrial',
        slug: 'safety',
        description: 'Equipos de protección personal',
        image: '/images/categories/safety.jpg',
        subcategories: [
          { id: 'helmets', name: 'Cascos', slug: 'helmets' },
          { id: 'gloves', name: 'Guantes', slug: 'gloves' },
          { id: 'masks', name: 'Máscaras', slug: 'masks' }
        ]
      },
      {
        id: 'gases',
        name: 'Componentes para Gases',
        slug: 'gases',
        description: 'Sistemas y componentes para gases industriales',
        image: '/images/categories/gases.jpg',
        subcategories: [
          { id: 'regulators', name: 'Reguladores', slug: 'regulators' },
          { id: 'flowmeters', name: 'Medidores', slug: 'flowmeters' },
          { id: 'fittings', name: 'Conexiones', slug: 'fittings' }
        ]
      }
    ]
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories' })
  }
})

export default router
