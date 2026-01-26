import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  ArrowDownTrayIcon, 
  CheckIcon, 
  XMarkIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { teamsApi } from '../../api/teams'
import { seasonsApi } from '../../api/seasons'
import { Team, Season, TeamStatus } from '../../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'

const statusLabels: Record<TeamStatus, string> = {
  pending: 'Ожидает',
  approved: 'Подтверждена',
  rejected: 'Отклонена',
  withdrawn: 'Снята'
}

const statusColors: Record<TeamStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800'
}

export default function TeamsManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchTeams = async () => {
    try {
      const filters: any = { limit: 100 }
      if (selectedSeason) filters.season_id = selectedSeason
      if (statusFilter) filters.status = statusFilter

      const data = await teamsApi.getList(filters)
      setTeams(data.items)
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const seasonsData = await seasonsApi.getList(false, true)
        setSeasons(seasonsData)
        if (seasonsData.length > 0) {
          const current = seasonsData.find(s => s.is_current)
          setSelectedSeason(current?.id || seasonsData[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch seasons:', error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      fetchTeams()
    }
  }, [selectedSeason, statusFilter])

  const handleStatusChange = async (teamId: number, newStatus: TeamStatus) => {
    try {
      await teamsApi.update(teamId, { status: newStatus })
      fetchTeams()
      toast.success('Статус обновлён')
    } catch (error) {
      toast.error('Ошибка обновления статуса')
    }
  }

  const handleDelete = async (team: Team) => {
    if (!confirm(`Удалить команду "${team.name}"? Это действие необратимо.`)) return

    try {
      await teamsApi.delete(team.id)
      setTeams(teams.filter(t => t.id !== team.id))
      if (selectedTeam?.id === team.id) {
        setSelectedTeam(null)
      }
      toast.success('Команда удалена')
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await teamsApi.exportExcel(selectedSeason || undefined)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teams_${selectedSeason || 'all'}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Файл скачан')
    } catch (error) {
      toast.error('Ошибка экспорта')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Управление командами
        </h1>
        <Button 
          onClick={handleExport} 
          isLoading={exporting}
          leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
        >
          Экспорт в Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-4">
        <div className="w-48">
          <Select
            label="Сезон"
            options={seasons.map(s => ({ value: s.id.toString(), label: s.name }))}
            value={selectedSeason?.toString() || ''}
            onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
          />
        </div>
        <div className="w-48">
          <Select
            label="Статус"
            options={[
              { value: '', label: 'Все' },
              { value: 'pending', label: 'Ожидают' },
              { value: 'approved', label: 'Подтверждены' },
              { value: 'rejected', label: 'Отклонены' },
              { value: 'withdrawn', label: 'Сняты' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
          <p className="text-sm text-gray-500">Всего команд</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {teams.filter(t => t.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500">Ожидают</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">
            {teams.filter(t => t.status === 'approved').length}
          </p>
          <p className="text-sm text-gray-500">Подтверждены</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-600">
            {teams.filter(t => t.status === 'rejected').length}
          </p>
          <p className="text-sm text-gray-500">Отклонены</p>
        </div>
      </div>

      {/* Teams list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Команда</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Организация</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Лига</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{team.name}</p>
                  <p className="text-sm text-gray-500">{team.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {team.organization}
                  {team.city && <span className="block text-xs">{team.city}</span>}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    team.league === 'junior' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {team.league === 'junior' ? 'Юниоры' : 'Основная'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[team.status]}`}>
                    {statusLabels[team.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(team.created_at), 'dd.MM.yyyy', { locale: ru })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Подробнее"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    {team.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(team.id, 'approved')}
                          className="p-2 text-green-500 hover:text-green-700"
                          title="Подтвердить"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(team.id, 'rejected')}
                          className="p-2 text-red-500 hover:text-red-700"
                          title="Отклонить"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(team)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Удалить"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {teams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Команд не найдено
          </div>
        )}
      </div>

      {/* Team detail modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-lg"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-heading font-bold">{selectedTeam.name}</h2>
              <button onClick={() => setSelectedTeam(null)}>
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedTeam.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Телефон</p>
                  <p className="font-medium">{selectedTeam.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Организация</p>
                  <p className="font-medium">{selectedTeam.organization}</p>
                </div>
                <div>
                  <p className="text-gray-500">Город</p>
                  <p className="font-medium">{selectedTeam.city || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Участников</p>
                  <p className="font-medium">{selectedTeam.participants_count}</p>
                </div>
                <div>
                  <p className="text-gray-500">Лига</p>
                  <p className="font-medium">
                    {selectedTeam.league === 'junior' ? 'Юниоры' : 'Основная'}
                  </p>
                </div>
              </div>

              {selectedTeam.poster_link && (
                <div>
                  <p className="text-gray-500 text-sm">Технический плакат</p>
                  <a 
                    href={selectedTeam.poster_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-eurobot-blue hover:underline text-sm"
                  >
                    Открыть ссылку
                  </a>
                </div>
              )}

              {selectedTeam.members.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Участники команды ({selectedTeam.members.length})</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedTeam.members.map((member) => (
                      <div key={member.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{member.full_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            member.role === 'Капитан' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'Куратор' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {member.role || 'Участник'}
                          </span>
                        </div>
                        {(member.email || member.phone) && (
                          <div className="mt-1 text-xs text-gray-500">
                            {member.email && <span className="mr-3">{member.email}</span>}
                            {member.phone && <span>{member.phone}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-between items-center">
              <Select
                value={selectedTeam.status}
                onChange={(e) => handleStatusChange(selectedTeam.id, e.target.value as TeamStatus)}
                options={[
                  { value: 'pending', label: 'Ожидает' },
                  { value: 'approved', label: 'Подтверждена' },
                  { value: 'rejected', label: 'Отклонена' },
                  { value: 'withdrawn', label: 'Снята' }
                ]}
              />
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => handleDelete(selectedTeam)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="w-5 h-5 mr-1" />
                  Удалить
                </Button>
                <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
                  Закрыть
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}



