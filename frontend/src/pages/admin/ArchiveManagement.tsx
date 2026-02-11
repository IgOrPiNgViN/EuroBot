import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  PlayIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { archiveApi, ArchiveSeasonCreateData, ArchiveMediaCreateData } from '../../api/archive'
import { ArchiveSeason, ArchiveMedia, MediaType, ArchiveSeasonDescriptionData } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import '../../styles/pages/admin/ArchiveManagement.css'

export default function ArchiveManagement() {
  const [seasons, setSeasons] = useState<ArchiveSeason[]>([])
  const [loading, setLoading] = useState(true)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<ArchiveSeason | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<ArchiveSeason | null>(null)
  const [seasonForm, setSeasonForm] = useState<Partial<ArchiveSeasonCreateData & {
    mainDescription: string;
    logoUrl: string;
    titleImageUrl: string;
  }>>({})
  const [mediaForm, setMediaForm] = useState<Partial<ArchiveMediaCreateData>>({ media_type: 'photo' })
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingSeason, setDeletingSeason] = useState<ArchiveSeason | null>(null)

  const fetchSeasons = async () => {
    try {
      const data = await archiveApi.getSeasons()
      setSeasons(data)
    } catch (error) {
      console.error('Failed to fetch archive:', error)
      toast.error('Ошибка загрузки архива')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const handleCreateSeason = () => {
    setEditingSeason(null)
    setSeasonForm({ mainDescription: '', logoUrl: '', titleImageUrl: '' })
    setShowSeasonModal(true)
  }

  function encodeDescriptionData(data: ArchiveSeasonDescriptionData): string {
    const { mainDescription = '', ...extraData } = data;

    if (Object.keys(extraData).length > 0) {
      const encodedData = JSON.stringify(extraData);
      return `{MAIN}${mainDescription}{JSON}${encodedData}`;
    }

    return mainDescription;
  }

  function decodeDescriptionData(description: string): ArchiveSeasonDescriptionData {
    if (!description) {
      return { mainDescription: '' };
    }

    const jsonMatch = description.match(/\{JSON\}(.*)$/);
    const mainMatch = description.match(/^\{MAIN\}(.*?)(?=\{JSON\}|$)/);

    if (jsonMatch && mainMatch) {
      try {
        const mainDescription = mainMatch[1];
        const jsonData = JSON.parse(jsonMatch[1]);
        return {
          mainDescription,
          ...jsonData
        };
      } catch (error) {
        console.error('Failed to parse description JSON:', error);
        return { mainDescription: description };
      }
    }

    return { mainDescription: description };
  }

  const handleEditSeason = (season: ArchiveSeason) => {
    setEditingSeason(season)

    // Декодируем description чтобы получить отдельные поля
    const descriptionData = decodeDescriptionData(season.description || '')

    setSeasonForm({
      year: season.year,
      name: season.name,
      theme: season.theme || '',
      mainDescription: descriptionData.mainDescription || '',
      logoUrl: descriptionData.logoUrl || '',
      titleImageUrl: descriptionData.titleImageUrl || '',
      cover_image: season.cover_image || '',
      first_place: season.first_place || '',
      second_place: season.second_place || '',
      third_place: season.third_place || '',
      additional_info: season.additional_info || '',
      teams_count: season.teams_count || undefined
    })
    setShowSeasonModal(true)
  }

  const handleSaveSeason = async () => {
    if (!seasonForm.year || !seasonForm.name) {
      toast.error('Заполните год и название')
      return
    }

    setSaving(true)
    try {
      const seasonData: Partial<ArchiveSeasonCreateData> = {
        year: seasonForm.year,
        name: seasonForm.name,
        theme: seasonForm.theme || '',
        cover_image: seasonForm.cover_image || '',
        first_place: seasonForm.first_place || '',
        second_place: seasonForm.second_place || '',
        third_place: seasonForm.third_place || '',
        additional_info: seasonForm.additional_info || '',
        teams_count: seasonForm.teams_count || undefined,
        description: encodeDescriptionData({
          mainDescription: seasonForm.mainDescription || '',
          logoUrl: seasonForm.logoUrl || '',
          titleImageUrl: seasonForm.titleImageUrl || ''
        })
      }

      if (editingSeason) {
        await archiveApi.updateSeason(editingSeason.id, seasonData)
        toast.success('Сезон обновлён')
      } else {
        await archiveApi.createSeason(seasonData as ArchiveSeasonCreateData)
        toast.success('Сезон добавлен в архив')
      }
      setShowSeasonModal(false)
      fetchSeasons()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (season: ArchiveSeason) => {
    setDeletingSeason(season)
    setShowDeleteModal(true)
  }

  const handleDeleteSeason = async () => {
    if (!deletingSeason) return

    try {
      await archiveApi.deleteSeason(deletingSeason.id)
      toast.success('Сезон удалён из архива')
      setShowDeleteModal(false)
      setDeletingSeason(null)
      fetchSeasons()
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  const handleRestoreSeason = async () => {
    if (!deletingSeason) return

    try {
      await archiveApi.restoreSeason(deletingSeason.id)
      toast.success('Сезон восстановлен и возвращён в список сезонов')
      setShowDeleteModal(false)
      setDeletingSeason(null)
      fetchSeasons()
    } catch (error) {
      toast.error('Ошибка восстановления')
    }
  }

  const handleAddMedia = (season: ArchiveSeason) => {
    setSelectedSeason(season)
    setMediaForm({ media_type: 'photo' })
    setShowMediaModal(true)
  }

  const handleSaveMedia = async () => {
    if (!selectedSeason || !mediaForm.file_path) {
      toast.error('Укажите ссылку на файл')
      return
    }

    setSaving(true)
    try {
      await archiveApi.addMedia(selectedSeason.id, mediaForm as ArchiveMediaCreateData)
      toast.success('Медиафайл добавлен')
      setShowMediaModal(false)
      fetchSeasons()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка добавления')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMedia = async (mediaId: number) => {
    if (!confirm('Удалить этот медиафайл?')) return

    try {
      await archiveApi.deleteMedia(mediaId)
      toast.success('Медиафайл удалён')
      fetchSeasons()
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
      <div className="archive-management">
        <div className="archive-management-header">
          <div>
            <h1 className="archive-management-title">Архив сезонов</h1>
            <p className="archive-management-subtitle">Управление архивом прошлых соревнований</p>
          </div>
          <Button onClick={handleCreateSeason}>
            <PlusIcon className="archive-management-button-icon" />
            Добавить сезон
          </Button>
        </div>

        {seasons.length === 0 ? (
            <div className="archive-management-empty">
              <p className="archive-management-empty-text">Архив пуст</p>
              <Button onClick={handleCreateSeason}>
                <PlusIcon className="archive-management-button-icon" />
                Добавить первый сезон
              </Button>
            </div>
        ) : (
            <div className="archive-management-list">
              {seasons.map((season) => {
                // Для отображения в карточке используем декодированные данные
                const descriptionData = decodeDescriptionData(season.description || '');
                const mainDescription = descriptionData.mainDescription;
                const logoUrl = descriptionData.logoUrl;
                const titleImageUrl = descriptionData.titleImageUrl;

                return (
                    <motion.div
                        key={season.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="archive-management-season-card"
                    >
                      <div className="archive-management-season-content">
                        <div className="archive-management-season-header">
                          <div className="archive-management-season-info">
                            {season.cover_image && (
                                <img
                                    src={season.cover_image}
                                    alt={season.name}
                                    className="archive-management-season-cover"
                                />
                            )}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                {logoUrl && (
                                    <img
                                        src={logoUrl}
                                        alt="Логотип"
                                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                    />
                                )}
                                <h3 className="archive-management-season-name">
                                  {season.year} — {season.name}
                                </h3>
                              </div>
                              {titleImageUrl && (
                                  <img
                                      src={titleImageUrl}
                                      alt="Название"
                                      style={{ maxWidth: '200px', maxHeight: '40px', objectFit: 'contain', marginBottom: '0.5rem' }}
                                  />
                              )}
                              {season.theme && (
                                  <p className="archive-management-season-theme">Тема: {season.theme}</p>
                              )}
                              {mainDescription && (
                                  <p className="archive-management-season-description">{mainDescription}</p>
                              )}
                              {season.teams_count && (
                                  <p className="archive-management-season-teams">Команд: {season.teams_count}</p>
                              )}
                            </div>
                          </div>
                          <div className="archive-management-season-actions">
                            <button
                                onClick={() => handleAddMedia(season)}
                                className="archive-management-action-button archive-management-add-media-button"
                                title="Добавить медиа"
                            >
                              <PlusIcon className="archive-management-action-icon" />
                            </button>
                            <button
                                onClick={() => handleEditSeason(season)}
                                className="archive-management-action-button archive-management-edit-button"
                                title="Редактировать"
                            >
                              <PencilIcon className="archive-management-action-icon" />
                            </button>
                            <button
                                onClick={() => handleDeleteClick(season)}
                                className="archive-management-action-button archive-management-delete-button"
                                title="Удалить"
                            >
                              <TrashIcon className="archive-management-action-icon" />
                            </button>
                          </div>
                        </div>

                        {/* Media grid */}
                        {season.media && season.media.length > 0 && (
                            <div className="archive-management-media-section">
                              <h4 className="archive-management-media-title">
                                Медиафайлы ({season.media.length})
                              </h4>
                              <div className="archive-management-media-grid">
                                {season.media.map((media) => (
                                    <div key={media.id} className="archive-management-media-item">
                                      <div className="archive-management-media-preview">
                                        {media.media_type === 'photo' && (
                                            <img
                                                src={media.thumbnail || media.file_path}
                                                alt={media.title || ''}
                                                className="archive-management-media-image"
                                            />
                                        )}
                                        {media.media_type === 'video' && (
                                            <div className="archive-management-video-placeholder">
                                              <PlayIcon className="archive-management-media-placeholder-icon" />
                                            </div>
                                        )}
                                        {media.media_type === 'document' && (
                                            <div className="archive-management-document-placeholder">
                                              <DocumentIcon className="archive-management-media-placeholder-icon" />
                                            </div>
                                        )}
                                      </div>
                                      <button
                                          onClick={() => handleDeleteMedia(media.id)}
                                          className="archive-management-media-delete-button"
                                      >
                                        <TrashIcon className="archive-management-media-delete-icon" />
                                      </button>
                                      {media.title && (
                                          <p className="archive-management-media-label">{media.title}</p>
                                      )}
                                    </div>
                                ))}
                              </div>
                            </div>
                        )}
                      </div>
                    </motion.div>
                );
              })}
            </div>
        )}

        {/* Season Modal */}
        {showSeasonModal && (
            <div className="archive-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="archive-management-modal archive-management-season-modal"
              >
                <div className="archive-management-modal-header">
                  <h2 className="archive-management-modal-title">
                    {editingSeason ? 'Редактировать сезон' : 'Добавить сезон в архив'}
                  </h2>
                </div>

                <div className="archive-management-modal-content">
                  {/* Первая колонка */}
                  <div className="archive-management-two-columns">
                    <div className="archive-management-column-left">
                      <div className="archive-management-form-grid">
                        <Input
                            label="Год"
                            type="number"
                            required
                            value={seasonForm.year || ''}
                            onChange={(e) => setSeasonForm({ ...seasonForm, year: parseInt(e.target.value) })}
                            placeholder="2025"
                        />
                        <Input
                            label="Количество команд"
                            type="number"
                            value={seasonForm.teams_count || ''}
                            onChange={(e) => setSeasonForm({ ...seasonForm, teams_count: parseInt(e.target.value) || undefined })}
                        />
                      </div>

                      <Input
                          label="Название"
                          required
                          value={seasonForm.name || ''}
                          onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                          placeholder="Евробот 2025"
                      />

                      <Input
                          label="Тема сезона"
                          value={seasonForm.theme || ''}
                          onChange={(e) => setSeasonForm({ ...seasonForm, theme: e.target.value })}
                          placeholder="Например: Farming Mars"
                      />

                      <Input
                          label="URL логотипа"
                          value={seasonForm.logoUrl || ''}
                          onChange={(e) => setSeasonForm({ ...seasonForm, logoUrl: e.target.value })}
                          placeholder="https://..."
                      />

                      <Input
                          label="URL картинки названия"
                          value={seasonForm.titleImageUrl || ''}
                          onChange={(e) => setSeasonForm({ ...seasonForm, titleImageUrl: e.target.value })}
                          placeholder="https://..."
                      />

                      <Textarea
                          label="Описание"
                          value={seasonForm.mainDescription || ''}
                          onChange={(e) => setSeasonForm({ ...seasonForm, mainDescription: e.target.value })}
                          rows={3}
                      />

                      <Input
                          label="URL обложки"
                          value={seasonForm.cover_image || ''}
                          onChange={(e) => setSeasonForm({ ...seasonForm, cover_image: e.target.value })}
                          placeholder="https://..."
                      />
                    </div>

                    {/* Вторая колонка */}
                    <div className="archive-management-column-right">
                      <div className="archive-management-winners-section">
                        <h4 className="archive-management-winners-title">🏆 Призёры соревнований</h4>
                        <div className="archive-management-winners-fields">
                          <Input
                              label="🥇 1 место"
                              value={seasonForm.first_place || ''}
                              onChange={(e) => setSeasonForm({ ...seasonForm, first_place: e.target.value })}
                              placeholder="Название команды — 150 очков"
                          />
                          <Input
                              label="🥈 2 место"
                              value={seasonForm.second_place || ''}
                              onChange={(e) => setSeasonForm({ ...seasonForm, second_place: e.target.value })}
                              placeholder="Название команды — 142 очка"
                          />
                          <Input
                              label="🥉 3 место"
                              value={seasonForm.third_place || ''}
                              onChange={(e) => setSeasonForm({ ...seasonForm, third_place: e.target.value })}
                              placeholder="Название команды — 138 очков"
                          />
                          <Textarea
                              label="Дополнительная информация"
                              value={seasonForm.additional_info || ''}
                              onChange={(e) => setSeasonForm({ ...seasonForm, additional_info: e.target.value })}
                              rows={2}
                              placeholder="Например: Всего участвовало 45 команд из 12 регионов"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="archive-management-modal-footer">
                  <Button variant="ghost" onClick={() => setShowSeasonModal(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSaveSeason} isLoading={saving}>
                    {editingSeason ? 'Сохранить' : 'Создать'}
                  </Button>
                </div>
              </motion.div>
            </div>
        )}

        {showMediaModal && selectedSeason && (
            <div className="archive-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="archive-management-modal"
              >
                <div className="archive-management-modal-header">
                  <h2 className="archive-management-modal-title">
                    Добавить медиафайл
                  </h2>
                  <p className="archive-management-modal-subtitle">в {selectedSeason.name}</p>
                </div>

                <div className="archive-management-modal-content">
                  <Select
                      label="Тип медиа"
                      value={mediaForm.media_type || 'photo'}
                      onChange={(e) => setMediaForm({ ...mediaForm, media_type: e.target.value as MediaType })}
                      options={[
                        { value: 'photo', label: 'Фото' },
                        { value: 'video', label: 'Видео' },
                        { value: 'document', label: 'Документ' }
                      ]}
                  />

                  <Input
                      label="Название"
                      value={mediaForm.title || ''}
                      onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                      placeholder="Название файла"
                  />

                  <Input
                      label={mediaForm.media_type === 'video' ? 'URL видео' : 'URL файла'}
                      required
                      value={mediaForm.file_path || ''}
                      onChange={(e) => setMediaForm({ ...mediaForm, file_path: e.target.value })}
                      placeholder="https://..."
                  />

                  {mediaForm.media_type === 'video' && (
                      <Input
                          label="URL превью (thumbnail)"
                          value={mediaForm.thumbnail || ''}
                          onChange={(e) => setMediaForm({ ...mediaForm, thumbnail: e.target.value })}
                          placeholder="https://..."
                      />
                  )}

                  {mediaForm.media_type === 'photo' && (
                      <Input
                          label="URL миниатюры"
                          value={mediaForm.thumbnail || ''}
                          onChange={(e) => setMediaForm({ ...mediaForm, thumbnail: e.target.value })}
                          placeholder="https://... (опционально)"
                      />
                  )}

                  <Textarea
                      label="Описание"
                      value={mediaForm.description || ''}
                      onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
                      rows={2}
                  />
                </div>

                <div className="archive-management-modal-footer">
                  <Button variant="ghost" onClick={() => setShowMediaModal(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSaveMedia} isLoading={saving}>
                    Добавить
                  </Button>
                </div>
              </motion.div>
            </div>
        )}

        {showDeleteModal && deletingSeason && (
            <div className="archive-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="archive-management-modal archive-management-delete-modal"
              >
                <div className="archive-management-modal-header">
                  <h2 className="archive-management-modal-title">
                    Что сделать с архивом?
                  </h2>
                  <p className="archive-management-modal-subtitle">
                    {deletingSeason.year} — {deletingSeason.name}
                  </p>
                </div>

                <div className="archive-management-modal-content">
                  <p className="archive-management-delete-text">
                    Выберите действие для этого архивного сезона:
                  </p>

                  <div className="archive-management-actions-grid">
                    <button
                        onClick={handleRestoreSeason}
                        className="archive-management-action-option archive-management-restore-option"
                    >
                      <div className="archive-management-action-icon-container archive-management-restore-icon">
                        <svg className="archive-management-action-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="archive-management-action-title">Вернуть в сезоны</h4>
                        <p className="archive-management-action-description">Сезон будет восстановлен и появится в списке сезонов</p>
                      </div>
                    </button>

                    <button
                        onClick={handleDeleteSeason}
                        className="archive-management-action-option archive-management-delete-option"
                    >
                      <div className="archive-management-action-icon-container archive-management-delete-icon">
                        <TrashIcon className="archive-management-action-svg" />
                      </div>
                      <div>
                        <h4 className="archive-management-action-title">Удалить полностью</h4>
                        <p className="archive-management-action-description">Архив и все медиафайлы будут удалены навсегда</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="archive-management-modal-footer">
                  <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeletingSeason(null)
                      }}
                      className="archive-management-cancel-button"
                  >
                    Отмена
                  </Button>
                </div>
              </motion.div>
            </div>
        )}
      </div>
  )
}