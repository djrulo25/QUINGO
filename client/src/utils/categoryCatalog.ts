import { CategoryTreeNode } from '@/types'

export interface CategoryCatalogItem {
  category: CategoryTreeNode
  root: CategoryTreeNode
  depth: number
}

export const CATEGORY_IMAGE_BY_KEY: Record<string, string> = {
  soldadura: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=640&q=80',
  'proteccion-industrial':
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=640&q=80',
  gases: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80',
  electrodos: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=640&q=80',
  maquinas: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=640&q=80',
  accesorios: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=640&q=80',
  guantes: 'https://images.unsplash.com/photo-1581091870622-2f4f2f2a3020?auto=format&fit=crop&w=640&q=80',
  cascos: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=640&q=80',
  reguladores: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=640&q=80',
  mangueras: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=640&q=80',
}

export const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=640&q=80'

export const getCategoryImage = (category: CategoryTreeNode) => {
  if (category.image?.startsWith('http')) {
    return category.image
  }

  if (CATEGORY_IMAGE_BY_KEY[category.slug]) {
    return CATEGORY_IMAGE_BY_KEY[category.slug]
  }

  const label = `${category.slug} ${category.name}`.toLowerCase()

  if (label.includes('soldadura') || label.includes('electrodo')) {
    return CATEGORY_IMAGE_BY_KEY.soldadura
  }

  if (label.includes('proteccion') || label.includes('guante') || label.includes('casco')) {
    return CATEGORY_IMAGE_BY_KEY['proteccion-industrial']
  }

  if (label.includes('gas') || label.includes('regulador') || label.includes('manguera')) {
    return CATEGORY_IMAGE_BY_KEY.gases
  }

  return DEFAULT_CATEGORY_IMAGE
}

export const flattenCategoryCatalog = (
  categories: CategoryTreeNode[],
  root?: CategoryTreeNode,
  depth = 0
): CategoryCatalogItem[] => {
  return categories.flatMap((category) => {
    const currentRoot = root || category
    return [
      { category, root: currentRoot, depth },
      ...flattenCategoryCatalog(category.children || [], currentRoot, depth + 1),
    ]
  })
}

export const getCategoryProductLink = (item: CategoryCatalogItem | CategoryTreeNode) => {
  const category = 'category' in item ? item.category : item
  const root = 'root' in item ? item.root : category
  const params = new URLSearchParams({ category: root.slug })

  if (category.id !== root.id) {
    params.set('subcategory', category.slug)
  }

  return `/products?${params.toString()}`
}
