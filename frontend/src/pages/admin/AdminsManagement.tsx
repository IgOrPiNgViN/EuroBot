import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { authApi, AdminCreateData, AdminUpdateData } from '../../api/auth'
import { User, UserRole } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PhoneInput from '../../components/ui/PhoneInput'
import Select from '../../components/ui/Select'

const roleOptions = [
  { value: 'admin', label: 'Администратор' },
  { value: 'super_admin', label: 'Главный администратор' }
]

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'super_admin':
      return 'Главный администратор'
    case 'admin':
      return 'Администратор'
    default:
      return role
  }
}

export default function AdminsManagement() {
  const { user: currentUser } = useAuthStore()
  const [admins, setAdmins] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null)
  const [formData, setFormData] = useState<Partial<AdminCreateData & { is_active?: boolean }>>({})
  const [saving, setSaving] = useState(false)

  const fetchAdmins = async () => {
    try {
      const data = await authApi.getAdmins()
      setAdmins(data)
    } catch (error) {
      console.error('Failed to fetch admins:', error)
      toast.error('Ошибка загрузки списка администраторов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleCreate = () => {
    setEditingAdmin(null)
    setFormData({ role: 'admin' as UserRole, is_active: true })
    setShowModal(true)
  }

  const handleEdit = (admin: User) => {
    setEditingAdmin(admin)
    setFormData({
      full_name: admin.full_name || '',
      phone: admin.phone || '',
      role: admin.role,
      is_active: admin.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      toast.error('Нельзя удалить свой аккаунт')
      return
    }
    
    if (!confirm('Удалить этого администратора?')) return

    try {
      await authApi.deleteAdmin(id)
      setAdmins(admins.filter(a => a.id !== id))
      toast.success('Администратор удалён')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при удалении')
    }
  }

  const handleSave = async () => {
    if (editingAdmin) {
      // Update existing admin
      const updateData: AdminUpdateData = {}
      if (formData.full_name !== undefined) updateData.full_name = formData.full_name
      if (formData.phone !== undefined) updateData.phone = formData.phone
      if (formData.role !== undefined) updateData.role = formData.role
      if (formData.is_active !== undefined) updateData.is_active = formData.is_active
      if (formData.password) updateData.password = formData.password

      setSaving(true)
      try {
        await authApi.updateAdmin(editingAdmin.id, updateData)
        toast.success('Администратор обновлён')
        setShowModal(false)
        fetchAdmins()
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Ошибка сохранения')
      } finally {
        setSaving(false)
      }
    } else {
      // Create new admin
      if (!formData.email || !formData.password || !formData.role) {
        toast.error('Заполните обязательные поля')
        return
      }

      setSaving(true)
      try {
        await authApi.createAdmin({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role
        })
        toast.success('Администратор создан')
        setShowModal(false)
        fetchAdmins()
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Ошибка создания')
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Управление администраторами
          </h1>
          <p className="text-gray-500 mt-1">
            Добавление и редактирование администраторов системы
          </p>
        </div>
        <Button onClick={handleCreate} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Добавить админа
        </Button>
      </div>

      {/* Admins List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Администратор
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Последний вход
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className={!admin.is_active ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-eurobot-blue text-white flex items-center justify-center font-semibold">
                      {admin.full_name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.full_name || 'Без имени'}
                        {admin.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-eurobot-blue">(вы)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    admin.role === 'super_admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {admin.role === 'super_admin' && <ShieldCheckIcon className="w-3 h-3 mr-1" />}
                    {getRoleLabel(admin.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    admin.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {admin.last_login 
                    ? format(new Date(admin.last_login), 'dd MMM yyyy, HH:mm', { locale: ru })
                    : 'Не входил'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="Редактировать"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    {admin.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Удалить"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-md"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-bold">
                {editingAdmin ? 'Редактировать администратора' : 'Новый администратор'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {!editingAdmin && (
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@eurobot.ru"
                />
              )}

              <Input
                label="Полное имя"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Иван Иванов"
              />

              <PhoneInput
                label="Телефон"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label={editingAdmin ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
                type="password"
                required={!editingAdmin}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />

              <Select
                label="Роль"
                required
                options={roleOptions}
                value={formData.role || 'admin'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              />

              {editingAdmin && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                    disabled={editingAdmin.id === currentUser?.id}
                  />
                  <span className={editingAdmin.id === currentUser?.id ? 'text-gray-400' : ''}>
                    Активен
                  </span>
                  {editingAdmin.id === currentUser?.id && (
                    <span className="text-xs text-gray-400 ml-2">(нельзя деактивировать себя)</span>
                  )}
                </label>
              )}
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                {editingAdmin ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

