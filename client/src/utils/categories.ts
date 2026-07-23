import { CategoryTreeNode } from '@/types'

export const ROOT_CATEGORY_SLUG = 'todos-los-productos'

export const getTopLevelCategories = (categories: CategoryTreeNode[]) => {
  const rootCategory = findCategoryBySlug(categories, ROOT_CATEGORY_SLUG)
  if (!rootCategory) {
    return categories
  }

  const importedRootCategories = categories.filter((category) => category.id !== rootCategory.id)
  const visibleCategories = [...(rootCategory.children || []), ...importedRootCategories]

  return visibleCategories.filter(
    (category, index) => visibleCategories.findIndex((item) => item.id === category.id) === index
  )
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
