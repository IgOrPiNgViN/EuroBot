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
import '../../styles/pages/admin/TeamsManagement.css'

const statusLabels: Record<TeamStatus, string> = {
  pending: 'Ожидает',
  approved: 'Подтверждена',
  rejected: 'Отклонена',
  withdrawn: 'Снята'
}

const statusColors: Record<TeamStatus, string> = {
  pending: 'teams-management-status-pending',
  approved: 'teams-management-status-approved',
  rejected: 'teams-management-status-rejected',
  withdrawn: 'teams-management-status-withdrawn'
}

const leagueColors: Record<string, string> = {
  junior: 'teams-management-league-junior',
  main: 'teams-management-league-main'
}

const roleColors: Record<string, string> = {
  'Капитан': 'teams-management-role-captain',
  'Куратор': 'teams-management-role-curator',
  'Участник': 'teams-management-role-member'
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
      <div className="teams-management">
        <div className="teams-management-header">
          <h1 className="teams-management-title">
            Управление командами
          </h1>
          <Button
              onClick={handleExport}
              isLoading={exporting}
              leftIcon={<ArrowDownTrayIcon className="teams-management-button-icon" />}
          >
            Экспорт в Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="teams-management-filters">
          <div className="teams-management-filter">
            <Select
                label="Сезон"
                options={seasons.map(s => ({ value: s.id.toString(), label: s.name }))}
                value={selectedSeason?.toString() || ''}
                onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
            />
          </div>
          <div className="teams-management-filter">
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
        <div className="teams-management-stats">
          <div className="teams-management-stat">
            <p className="teams-management-stat-value">{teams.length}</p>
            <p className="teams-management-stat-label">Всего команд</p>
          </div>
          <div className="teams-management-stat">
            <p className="teams-management-stat-value teams-management-stat-pending">
              {teams.filter(t => t.status === 'pending').length}
            </p>
            <p className="teams-management-stat-label">Ожидают</p>
          </div>
          <div className="teams-management-stat">
            <p className="teams-management-stat-value teams-management-stat-approved">
              {teams.filter(t => t.status === 'approved').length}
            </p>
            <p className="teams-management-stat-label">Подтверждены</p>
          </div>
          <div className="teams-management-stat">
            <p className="teams-management-stat-value teams-management-stat-rejected">
              {teams.filter(t => t.status === 'rejected').length}
            </p>
            <p className="teams-management-stat-label">Отклонены</p>
          </div>
        </div>

        {/* Teams list */}
        <div className="teams-management-table-container">
          <table className="teams-management-table">
            <thead className="teams-management-table-header">
            <tr>
              <th className="teams-management-table-header-cell">Команда</th>
              <th className="teams-management-table-header-cell">Организация</th>
              <th className="teams-management-table-header-cell">Лига</th>
              <th className="teams-management-table-header-cell">Статус</th>
              <th className="teams-management-table-header-cell">Дата</th>
              <th className="teams-management-table-header-cell teams-management-table-header-actions">Действия</th>
            </tr>
            </thead>
            <tbody className="teams-management-table-body">
            {teams.map((team) => (
                <tr key={team.id} className="teams-management-table-row">
                  <td className="teams-management-table-cell">
                    <p className="teams-management-team-name">{team.name}</p>
                    <p className="teams-management-team-email">{team.email}</p>
                  </td>
                  <td className="teams-management-table-cell">
                    <div className="teams-management-organization">
                      {team.organization}
                      {team.city && <span className="teams-management-team-city">{team.city}</span>}
                    </div>
                  </td>
                  <td className="teams-management-table-cell">
                  <span className={`teams-management-league-badge ${leagueColors[team.league]}`}>
                    {team.league === 'junior' ? 'Юниоры' : 'Основная'}
                  </span>
                  </td>
                  <td className="teams-management-table-cell">
                  <span className={`teams-management-status-badge ${statusColors[team.status]}`}>
                    {statusLabels[team.status]}
                  </span>
                  </td>
                  <td className="teams-management-table-cell">
                    <div className="teams-management-date">
                      {format(new Date(team.created_at), 'dd.MM.yyyy', { locale: ru })}
                    </div>
                  </td>
                  <td className="teams-management-table-cell">
                    <div className="teams-management-actions">
                      <button
                          onClick={() => setSelectedTeam(team)}
                          className="teams-management-action-button teams-management-view-button"
                          title="Подробнее"
                      >
                        <EyeIcon className="teams-management-action-icon" />
                      </button>
                      {team.status === 'pending' && (
                          <>
                            <button
                                onClick={() => handleStatusChange(team.id, 'approved')}
                                className="teams-management-action-button teams-management-approve-button"
                                title="Подтвердить"
                            >
                              <CheckIcon className="teams-management-action-icon" />
                            </button>
                            <button
                                onClick={() => handleStatusChange(team.id, 'rejected')}
                                className="teams-management-action-button teams-management-reject-button"
                                title="Отклонить"
                            >
                              <XMarkIcon className="teams-management-action-icon" />
                            </button>
                          </>
                      )}
                      <button
                          onClick={() => handleDelete(team)}
                          className="teams-management-action-button teams-management-delete-button"
                          title="Удалить"
                      >
                        <TrashIcon className="teams-management-action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>

          {teams.length === 0 && (
              <div className="teams-management-empty">
                Команд не найдено
              </div>
          )}
        </div>

        {/* Team detail modal */}
        {selectedTeam && (
            <div className="teams-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="teams-management-modal"
              >
                <div className="teams-management-modal-header">
                  <h2 className="teams-management-modal-title">{selectedTeam.name}</h2>
                  <button onClick={() => setSelectedTeam(null)} className="teams-management-modal-close">
                    <XMarkIcon className="teams-management-modal-close-icon" />
                  </button>
                </div>

                <div className="teams-management-modal-content">
                  <div className="teams-management-team-details">
                    <div className="teams-management-team-detail">
                      <p className="teams-management-detail-label">Email</p>
                      <p className="teams-management-detail-value">{selectedTeam.email}</p>
                    </div>
                    <div className="teams-management-team-detail">
                      <p className="teams-management-detail-label">Телефон</p>
                      <p className="teams-management-detail-value">{selectedTeam.phone}</p>
                    </div>
                    <div className="teams-management-team-detail">
                      <p className="teams-management-detail-label">Организация</p>
                      <p className="teams-management-detail-value">{selectedTeam.organization}</p>
                    </div>
                    <div className="teams-management-team-detail">
                      <p className="teams-management-detail-label">Город</p>
                      <p className="teams-management-detail-value">{selectedTeam.city || '—'}</p>
                    </div>
                    <div className="teams-management-team-detail">
                      <p className="teams-management-detail-label">Участников</p>
                      <p className="teams-management-detail-value">{selectedTeam.participants_count}</p>
                    </div>
                    <div className="teams-management-team-detail">
                      <p className="teams-management-detail-label">Лига</p>
                      <p className="teams-management-detail-value">
                        {selectedTeam.league === 'junior' ? 'Юниоры' : 'Основная'}
                      </p>
                    </div>
                  </div>

                  {selectedTeam.poster_link && (
                      <div className="teams-management-poster">
                        <p className="teams-management-poster-label">Технический плакат</p>
                        <a
                            href={selectedTeam.poster_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="teams-management-poster-link"
                        >
                          Открыть ссылку
                        </a>
                      </div>
                  )}

                  {selectedTeam.members.length > 0 && (
                      <div className="teams-management-members">
                        <p className="teams-management-members-label">
                          Участники команды ({selectedTeam.members.length})
                        </p>
                        <div className="teams-management-members-list">
                          {selectedTeam.members.map((member) => (
                              <div key={member.id} className="teams-management-member">
                                <div className="teams-management-member-header">
                                  <span className="teams-management-member-name">{member.full_name}</span>
                                  <span className={`teams-management-member-role ${roleColors[member.role || 'Участник']}`}>
                            {member.role || 'Участник'}
                          </span>
                                </div>
                                {(member.email || member.phone) && (
                                    <div className="teams-management-member-contacts">
                                      {member.email && <span className="teams-management-member-email">{member.email}</span>}
                                      {member.phone && <span className="teams-management-member-phone">{member.phone}</span>}
                                    </div>
                                )}
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                </div>

                <div className="teams-management-modal-footer">
                  <Select
                      value={selectedTeam.status}
                      onChange={(e) => handleStatusChange(selectedTeam.id, e.target.value as TeamStatus)}
                      options={[
                        { value: 'pending', label: 'Ожидает' },
                        { value: 'approved', label: 'Подтверждена' },
                        { value: 'rejected', label: 'Отклонена' },
                        { value: 'withdrawn', label: 'Снята' }
                      ]}
                      className="teams-management-status-select"
                  />
                  <div className="teams-management-modal-actions">
                    <Button
                        variant="ghost"
                        onClick={() => handleDelete(selectedTeam)}
                        className="teams-management-modal-delete"
                    >
                      <TrashIcon className="teams-management-modal-delete-icon" />
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