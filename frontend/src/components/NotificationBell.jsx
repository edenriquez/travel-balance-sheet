import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications } from '../api'

const POLL_MS = 45_000

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const list = await getNotifications({ unacknowledged_only: true })
      setItems(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las notificaciones')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const count = items.length

  const handleSelect = (n) => {
    setOpen(false)
    navigate(`/viaje/${n.trip_id}`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full text-neutral-600 hover:bg-neutral-200 transition-colors"
        aria-expanded={open}
        aria-label="Notificaciones"
      >
        <span className="material-icons text-[22px]">notifications</span>
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-12 w-[360px] max-h-[min(420px,calc(100vh-6rem))] bg-white rounded-xl shadow-dropdown border border-neutral-300/50 z-50 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-300/50 shrink-0">
              <h3 className="text-base font-bold text-neutral-900">Notificaciones</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Evidencias pendientes de revisión</p>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              {error && (
                <div className="px-5 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
                  {error}
                </div>
              )}
              {loading && items.length === 0 && !error && (
                <div className="px-5 py-8 text-center text-neutral-500 text-sm">Cargando…</div>
              )}
              {!loading && items.length === 0 && !error && (
                <div className="px-5 py-8 text-center text-neutral-500 text-sm">
                  Sin pendientes por ahora
                </div>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleSelect(n)}
                  className="w-full text-left px-5 py-3 border-b border-neutral-200/80 hover:bg-neutral-50 transition-colors last:border-b-0"
                >
                  <p className="text-sm font-semibold text-neutral-900 leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[11px] text-neutral-400 mt-2">
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString('es-MX', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
