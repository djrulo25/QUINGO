import '../config/env.js'
import { connectDB } from '../config/database.js'
import Category from '../models/Category.js'

async function seedCategories() {
  await connectDB()

  await Category.deleteMany({})

  const root = await Category.create({
    name: 'Todos los productos',
    slug: 'todos-los-productos',
    parent: null,
    level: 0,
    order: 0,
    path: 'todos-los-productos',
    image: '/images/categories/all.jpg',
    description: 'Menú principal de catálogo'
  })

  const soldadura = await Category.create({
    name: 'Soldadura',
    slug: 'soldadura',
    parent: root._id,
    level: 1,
    order: 1,
    path: `${root.path}/soldadura`,
    image: '/images/categories/soldadura.jpg',
    description: 'Materiales y equipo para soldar'
  })

  const seguridad = await Category.create({
    name: 'Protección Industrial',
    slug: 'proteccion-industrial',
    parent: root._id,
    level: 1,
    order: 2,
    path: `${root.path}/proteccion-industrial`,
    image: '/images/categories/seguridad.jpg',
    description: 'Equipo de seguridad personal'
  })

  const gases = await Category.create({
    name: 'Gases',
    slug: 'gases',
    parent: root._id,
    level: 1,
    order: 3,
    path: `${root.path}/gases`,
    image: '/images/categories/gases.jpg',
    description: 'Accesorios y componentes para gases'
  })

  await Category.insertMany([
    {
      name: 'Electrodos',
      slug: 'electrodos',
      parent: soldadura._id,
      level: 2,
      order: 1,
      path: `${soldadura.path}/electrodos`,
      image: '/images/categories/electrodos.jpg',
      description: 'Electrodos para soldadura'
    },
    {
      name: 'Máquinas',
      slug: 'maquinas',
      parent: soldadura._id,
      level: 2,
      order: 2,
      path: `${soldadura.path}/maquinas`,
      image: '/images/categories/maquinas.jpg',
      description: 'Máquinas y equipos de soldadura'
    },
    {
      name: 'Accesorios',
      slug: 'accesorios',
      parent: soldadura._id,
      level: 2,
      order: 3,
      path: `${soldadura.path}/accesorios`,
      image: '/images/categories/accesorios.jpg',
      description: 'Accesorios de soldadura'
    },
    {
      name: 'Guantes',
      slug: 'guantes',
      parent: seguridad._id,
      level: 2,
      order: 1,
      path: `${seguridad.path}/guantes`,
      image: '/images/categories/guantes.jpg',
      description: 'Guantes de protección'
    },
    {
      name: 'Cascos',
      slug: 'cascos',
      parent: seguridad._id,
      level: 2,
      order: 2,
      path: `${seguridad.path}/cascos`,
      image: '/images/categories/cascos.jpg',
      description: 'Cascos y equipo protector'
    },
    {
      name: 'Reguladores',
      slug: 'reguladores',
      parent: gases._id,
      level: 2,
      order: 1,
      path: `${gases.path}/reguladores`,
      image: '/images/categories/reguladores.jpg',
      description: 'Reguladores y control de flujo'
    },
    {
      name: 'Mangueras',
      slug: 'mangueras',
      parent: gases._id,
      level: 2,
      order: 2,
      path: `${gases.path}/mangueras`,
      image: '/images/categories/mangueras.jpg',
      description: 'Mangueras para gases'
    }
  ])

  console.log('✅ Categories seeded successfully')
  process.exit(0)
}

seedCategories().catch((error) => {
  console.error('Error seeding categories:', error)
  process.exit(1)
})
