import { CategoryTreeNode } from '@/types'

export const ROOT_CATEGORY_SLUG = 'todos-los-productos'

export const getTopLevelCategories = (categories: CategoryTreeNode[]) => {
  const rootCategory = findCategoryBySlug(categories, ROOT_CATEGORY_SLUG)
  return rootCategory?.children || []
}

export const findCategoryBySlug = (categories: CategoryTreeNode[], slug: string): CategoryTreeNode | undefined => {
  for (const category of categories) {
    if (category.slug === slug) {
      return category
    }

    const foundChild = findCategoryBySlug(category.children || [], slug)
    if (foundChild) {
      return foundChild
    }
  }

  return undefined
}
