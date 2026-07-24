export interface StoredAdmin {
  id: string
  email: string
  name: string
  role: 'admin' | 'super_admin'
  profileId?: string
  profileName?: string
  permissions?: string[]
}

export const getStoredAdmin = (): StoredAdmin | null => {
  try {
    return JSON.parse(localStorage.getItem('admin') || 'null')
  } catch {
    return null
  }
}

export const hasAdminPermission = (permission: string) => {
  const admin = getStoredAdmin()
  return Boolean(admin && (admin.role === 'super_admin' || admin.permissions?.includes('*') || admin.permissions?.includes(permission)))
}
