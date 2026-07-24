import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAccessAPI } from '@/api'

const MODULES = [
  ['dashboard', 'Dashboard'],
  ['products', 'Productos'],
  ['categories', 'Categorías'],
  ['orders', 'Pedidos'],
  ['deliveries', 'Entregas'],
  ['returns', 'Devoluciones'],
  ['reports', 'Reportes'],
  ['settings', 'Configuración'],
] as const

type Profile = { _id: string; name: string; description?: string; permissions: string[]; active: boolean }
type AdminUser = { _id: string; name: string; email: string; role: string; active: boolean; profile?: { _id: string; name: string } }

const emptyProfile = { name: '', description: '', permissions: [] as string[], active: true }
const emptyUser = { name: '', email: '', password: '', profile: '', active: true }

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [profileForm, setProfileForm] = useState(emptyProfile)
  const [userForm, setUserForm] = useState(emptyUser)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)

  const load = async () => {
    const [profileResponse, userResponse] = await Promise.all([
      adminAccessAPI.getProfiles(),
      adminAccessAPI.getUsers(),
    ])
    setProfiles(profileResponse.data)
    setUsers(userResponse.data)
  }

  useEffect(() => { load().catch(() => toast.error('No se pudieron cargar los perfiles')) }, [])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (editingProfile) await adminAccessAPI.updateProfile(editingProfile, profileForm)
      else await adminAccessAPI.createProfile(profileForm)
      toast.success(editingProfile ? 'Perfil actualizado' : 'Perfil creado')
      setProfileForm(emptyProfile)
      setEditingProfile(null)
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo guardar el perfil')
    }
  }

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await adminAccessAPI.createUser(userForm)
      toast.success('Usuario administrativo creado')
      setUserForm(emptyUser)
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo crear el usuario')
    }
  }

  const toggleUser = async (user: AdminUser) => {
    try {
      await adminAccessAPI.updateUser(user._id, { active: !user.active })
      toast.success(user.active ? 'Usuario desactivado' : 'Usuario activado')
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo actualizar')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Perfiles y accesos</h1>
        <p className="mt-1 text-gray-600">Crea perfiles, habilita módulos y asigna usuarios administrativos.</p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <form onSubmit={saveProfile} className="space-y-4 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">{editingProfile ? 'Editar perfil' : 'Nuevo perfil'}</h2>
          <input required placeholder="Nombre del perfil" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <textarea placeholder="Descripción (opcional)" value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <div className="grid gap-2 sm:grid-cols-2">
            {MODULES.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border p-3">
                <input type="checkbox" checked={profileForm.permissions.includes(key)} onChange={() => setProfileForm((current) => ({ ...current, permissions: current.permissions.includes(key) ? current.permissions.filter((item) => item !== key) : [...current.permissions, key] }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={profileForm.active} onChange={(e) => setProfileForm({ ...profileForm, active: e.target.checked })} /> Perfil activo</label>
          <div className="flex gap-2">
            <button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">{editingProfile ? 'Guardar cambios' : 'Crear perfil'}</button>
            {editingProfile && <button type="button" onClick={() => { setEditingProfile(null); setProfileForm(emptyProfile) }} className="rounded-lg border px-4 py-2">Cancelar</button>}
          </div>
        </form>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <h2 className="border-b p-5 text-xl font-bold">Perfiles registrados</h2>
          <div className="divide-y">
            {profiles.map((profile) => (
              <div key={profile._id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2"><strong>{profile.name}</strong><span className={`rounded-full px-2 py-0.5 text-xs ${profile.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{profile.active ? 'Activo' : 'Inactivo'}</span></div>
                  <p className="text-sm text-gray-500">{profile.permissions.map((key) => MODULES.find(([item]) => item === key)?.[1] || key).join(', ') || 'Sin módulos asignados'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProfile(profile._id); setProfileForm({ name: profile.name, description: profile.description || '', permissions: profile.permissions, active: profile.active }) }} className="rounded-lg border px-3 py-2 text-sm">Editar</button>
                  <button onClick={async () => { if (!confirm(`¿Eliminar el perfil ${profile.name}?`)) return; try { await adminAccessAPI.deleteProfile(profile._id); await load() } catch (error: any) { toast.error(error.response?.data?.error || 'No se pudo eliminar') } }} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Eliminar</button>
                </div>
              </div>
            ))}
            {!profiles.length && <p className="p-5 text-gray-500">Todavía no hay perfiles configurados.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <form onSubmit={saveUser} className="space-y-4 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Nuevo usuario administrativo</h2>
          <input required placeholder="Nombre" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <input required type="email" placeholder="Correo" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <input required minLength={6} type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <select required value={userForm.profile} onChange={(e) => setUserForm({ ...userForm, profile: e.target.value })} className="w-full rounded-lg border px-3 py-2">
            <option value="">Selecciona un perfil</option>
            {profiles.filter((profile) => profile.active).map((profile) => <option key={profile._id} value={profile._id}>{profile.name}</option>)}
          </select>
          <button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">Crear usuario</button>
        </form>

        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full min-w-[620px]">
            <thead className="bg-gray-50 text-left text-sm text-gray-600"><tr><th className="p-4">Usuario</th><th className="p-4">Perfil</th><th className="p-4">Estado</th><th className="p-4">Acción</th></tr></thead>
            <tbody className="divide-y">
              {users.map((user) => <tr key={user._id}><td className="p-4"><strong>{user.name}</strong><div className="text-sm text-gray-500">{user.email}</div></td><td className="p-4">{user.role === 'super_admin' ? 'Administrador principal' : <select value={user.profile?._id || ''} onChange={async (event) => { try { await adminAccessAPI.updateUser(user._id, { profile: event.target.value }); toast.success('Perfil asignado'); await load() } catch { toast.error('No se pudo asignar el perfil') } }} className="rounded-lg border px-2 py-2"><option value="">Sin perfil</option>{profiles.map((profile) => <option key={profile._id} value={profile._id}>{profile.name}</option>)}</select>}</td><td className="p-4">{user.active ? 'Activo' : 'Inactivo'}</td><td className="p-4">{user.role !== 'super_admin' && <button onClick={() => toggleUser(user)} className="rounded-lg border px-3 py-2 text-sm">{user.active ? 'Desactivar' : 'Activar'}</button>}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
