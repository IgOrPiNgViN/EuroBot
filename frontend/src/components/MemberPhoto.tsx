import { CSSProperties, PointerEvent, useRef, useState } from 'react'
import '../styles/pages/AboutPage.css'
import '../styles/components/MemberPhoto.css'

export interface MemberPhotoData {
  name: string
  photo_url: string
  /** Точка кадра, например "50% 20%" (CSS object-position) */
  photo_position?: string
  /** Приближение: 1 — как есть, больше — крупнее */
  photo_zoom?: number
}

const DEFAULT_POSITION = '50% 20%'

/** Кадрирование, заданное раньше прямо в коде, — пока в админке не выставили своё */
function legacyStyle(name: string): CSSProperties | undefined {
  const n = (name || '').toLowerCase()
  if (n.includes('марченко') && n.includes('светлан')) return { objectPosition: '50% 8%' }
  if (n.includes('дарья') && n.includes('ванк')) return { objectPosition: '45% 20%' }
  if (n.includes('конюшенко') && n.includes('светлан')) return { objectFit: 'contain', backgroundColor: '#fff' }
  return undefined
}

export function memberPhotoStyle(member: MemberPhotoData): CSSProperties | undefined {
  if (!member.photo_position && !member.photo_zoom) return legacyStyle(member.name)
  const position = member.photo_position || DEFAULT_POSITION
  const zoom = member.photo_zoom || 1
  return {
    objectPosition: position,
    ...(zoom !== 1 && { transform: `scale(${zoom})`, transformOrigin: position }),
  }
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

/** Фото в овальной рамке — так же, как на странице «О нас» */
export default function MemberPhoto({ member }: { member: MemberPhotoData }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="about-member-photo-container">
      {member.photo_url && !failed ? (
        <img
          src={member.photo_url}
          alt={member.name}
          className="about-member-photo"
          style={memberPhotoStyle(member)}
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="about-member-placeholder">{initials(member.name)}</div>
      )}
    </div>
  )
}

const parsePosition = (value?: string): [number, number] => {
  const m = (value || DEFAULT_POSITION).match(/(-?[\d.]+)%\s+(-?[\d.]+)%/)
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : [50, 20]
}

const clamp = (v: number) => Math.min(100, Math.max(0, v))

interface MemberPhotoEditorProps {
  member: MemberPhotoData
  onChange: (changes: { photo_position: string; photo_zoom: number }) => void
}

/** Предпросмотр рамки в админке: фото можно двигать мышью/пальцем и приближать */
export function MemberPhotoEditor({ member, onChange }: MemberPhotoEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; pos: [number, number] } | null>(null)
  const zoom = member.photo_zoom || 1

  if (!member.photo_url) return null

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, pos: parsePosition(member.photo_position) }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    const frame = frameRef.current
    if (!start || !frame) return
    const img = frame.querySelector('img')
    const fw = frame.clientWidth
    const fh = frame.clientHeight
    // Насколько фото больше рамки по каждой оси — столько и можно сдвигать
    let overX = fw * (zoom - 1)
    let overY = fh * (zoom - 1)
    if (img && img.naturalWidth) {
      const cover = Math.max(fw / img.naturalWidth, fh / img.naturalHeight)
      overX = Math.max(overX, img.naturalWidth * cover * zoom - fw)
      overY = Math.max(overY, img.naturalHeight * cover * zoom - fh)
    }
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const x = clamp(start.pos[0] - (overX > 1 ? (dx / overX) * 100 : 0))
    const y = clamp(start.pos[1] - (overY > 1 ? (dy / overY) * 100 : 0))
    onChange({ photo_position: `${Math.round(x)}% ${Math.round(y)}%`, photo_zoom: zoom })
  }

  const onPointerUp = () => {
    drag.current = null
  }

  return (
    <div className="member-photo-editor">
      <div
        ref={frameRef}
        className="member-photo-editor-frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="Перетащите фото, чтобы выровнять"
      >
        <MemberPhoto member={member} />
      </div>
      <div className="member-photo-editor-controls">
        <p className="member-photo-editor-hint">Так фото будет выглядеть на сайте. Перетащите его мышкой, чтобы выровнять лицо.</p>
        <label className="member-photo-editor-zoom">
          Приближение
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.05}
            value={zoom}
            onChange={(e) =>
              onChange({
                photo_position: member.photo_position || DEFAULT_POSITION,
                photo_zoom: parseFloat(e.target.value),
              })
            }
          />
        </label>
        <button
          type="button"
          className="member-photo-editor-reset"
          onClick={() => onChange({ photo_position: DEFAULT_POSITION, photo_zoom: 1 })}
        >
          Сбросить
        </button>
      </div>
    </div>
  )
}
