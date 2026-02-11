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
import '../../styles/pages/admin/AdminsManagement.css'

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
      <div className="admins-management">
        <div className="admins-management-header">
          <div>
            <h1 className="admins-management-title">
              Управление администраторами
            </h1>
            <p className="admins-management-subtitle">
              Добавление и редактирование администраторов системы
            </p>
          </div>
          <Button onClick={handleCreate} leftIcon={<PlusIcon className="admins-management-button-icon" />}>
            Добавить админа
          </Button>
        </div>

        {/* Admins List */}
        <div className="admins-management-table-container">
          <table className="admins-management-table">
            <thead className="admins-management-table-head">
            <tr>
              <th className="admins-management-table-header">
                Администратор
              </th>
              <th className="admins-management-table-header">
                Роль
              </th>
              <th className="admins-management-table-header">
                Статус
              </th>
              <th className="admins-management-table-header">
                Последний вход
              </th>
              <th className="admins-management-table-header admins-management-table-header-actions">
                Действия
              </th>
            </tr>
            </thead>
            <tbody className="admins-management-table-body">
            {admins.map((admin) => (
                <tr key={admin.id} className={`admins-management-table-row ${!admin.is_active ? 'admins-management-table-row-inactive' : ''}`}>
                  <td className="admins-management-table-cell">
                    <div className="admins-management-admin-info">
                      <div className="admins-management-admin-details">
                        <div className="admins-management-admin-name">
                          {admin.full_name || 'Без имени'}
                          {admin.id === currentUser?.id && (
                              <span className="admins-management-current-user">(вы)</span>
                          )}
                        </div>
                        <div className="admins-management-admin-email">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="admins-management-table-cell">
                  <span className={`admins-management-role-badge admins-management-role-badge-${admin.role}`}>
                    {admin.role === 'super_admin' && <ShieldCheckIcon className="admins-management-role-icon" />}
                    {getRoleLabel(admin.role)}
                  </span>
                  </td>
                  <td className="admins-management-table-cell">
                  <span className={`admins-management-status-badge ${admin.is_active ? 'admins-management-status-badge-active' : 'admins-management-status-badge-inactive'}`}>
                    {admin.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                  </td>
                  <td className="admins-management-table-cell admins-management-last-login">
                    {admin.last_login
                        ? format(new Date(admin.last_login), 'dd MMM yyyy, HH:mm', { locale: ru })
                        : 'Не входил'}
                  </td>
                  <td className="admins-management-table-cell admins-management-actions">
                    <div className="admins-management-actions-container">
                      <button
                          onClick={() => handleEdit(admin)}
                          className="admins-management-action-button admins-management-edit-button"
                          title="Редактировать"
                      >
                        <PencilIcon className="admins-management-action-icon" />
                      </button>
                      {admin.id !== currentUser?.id && (
                          <button
                              onClick={() => handleDelete(admin.id)}
                              className="admins-management-action-button admins-management-delete-button"
                              title="Удалить"
                          >
                            <TrashIcon className="admins-management-action-icon" />
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
            <div className="admins-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="admins-management-modal"
              >
                <div className="admins-management-modal-header">
                  <h2 className="admins-management-modal-title">
                    {editingAdmin ? 'Редактировать администратора' : 'Новый администратор'}
                  </h2>
                </div>

                <div className="admins-management-modal-content">
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
                      <label className="admins-management-checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="admins-management-checkbox"
                            disabled={editingAdmin.id === currentUser?.id}
                        />
                        <span className={editingAdmin.id === currentUser?.id ? 'admins-management-checkbox-disabled' : ''}>
                    Активен
                  </span>
                        {editingAdmin.id === currentUser?.id && (
                            <span className="admins-management-checkbox-hint">(нельзя деактивировать себя)</span>
                        )}
                      </label>
                  )}
                </div>

                <div className="admins-management-modal-footer">
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