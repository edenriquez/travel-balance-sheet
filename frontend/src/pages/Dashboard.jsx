import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrips, getDrivers } from '../api'
import NewTripModal from './NewTrip'

function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number(n))
}

const STATUS_CONFIG = {
  in_progress: { label: 'En curso', color: 'bg-info-main' },
  closed: { label: 'Completado', color: 'bg-success-main' },
  pending_review: { label: 'Pendiente', color: 'bg-warning-main' },
  with_rejections: { label: 'Con rechazos', color: 'bg-error-main' },
}

const PERIOD_OPTIONS = [
  { value: 'active', label: 'Viajes activos' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'custom', label: 'Rango personalizado' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Filter state
  const [period, setPeriod] = useState('active')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedDrivers, setSelectedDrivers] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Build API filters
  const apiFilters = useMemo(() => {
    const f = {}
    if (period === 'active') {
      f.status = 'in_progress'
    } else if (period === 'week') {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      f.start_date = start.toISOString().split('T')[0]
    } else if (period === 'month') {
      const now = new Date()
      f.start_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    } else if (period === 'custom') {
      if (customStart) f.start_date = customStart
      if (customEnd) f.end_date = customEnd
    }
    if (selectedStatuses.length === 1) {
      f.status = selectedStatuses[0]
    }
    if (selectedDrivers.length === 1) {
      f.driver_id = selectedDrivers[0]
    }
    return f
  }, [period, customStart, customEnd, selectedStatuses, selectedDrivers])

  const loadData = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    async function load() {
      try {
        const [tripsRes, driversRes] = await Promise.all([
          getTrips(apiFilters).catch(() => []),
          getDrivers().catch(() => []),
        ])
        if (!cancelled) {
          setTrips(Array.isArray(tripsRes) ? tripsRes : tripsRes?.items ?? [])
          setDrivers(Array.isArray(driversRes) ? driversRes : driversRes?.items ?? [])
        }
      } catch (e) {
        if (!cancelled) {
          setTrips([])
          setDrivers([])
          setError(e.message || 'Error al cargar viajes')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [apiFilters])

  useEffect(() => {
    return loadData()
  }, [loadData])

  // Client-side filtering for multi-select
  const filteredTrips = useMemo(() => {
    let result = trips
    if (selectedDrivers.length > 1) {
      result = result.filter((t) => selectedDrivers.includes(t.driver_id))
    }
    if (selectedStatuses.length > 1) {
      result = result.filter((t) => selectedStatuses.includes(t.status))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => {
        const driver = drivers.find((d) => d.id === t.driver_id)
        return (
          (t.origin_name || '').toLowerCase().includes(q) ||
          (t.destination_name || '').toLowerCase().includes(q) ||
          (t.folio || '').toLowerCase().includes(q) ||
          (t.delivery_client || '').toLowerCase().includes(q) ||
          (t.load_company || '').toLowerCase().includes(q) ||
          (driver?.name || '').toLowerCase().includes(q)
        )
      })
    }
    return result
  }, [trips, selectedDrivers, selectedStatuses, searchQuery, drivers])

  // Derive filter options from current data
  const availableDrivers = useMemo(() => {
    const ids = [...new Set(trips.map((t) => t.driver_id))]
    return ids.map((id) => drivers.find((d) => d.id === id)).filter(Boolean)
  }, [trips, drivers])

  const availableStatuses = useMemo(() => {
    return [...new Set(trips.map((t) => t.status))]
  }, [trips])

  // Chip helpers
  const activeChips = useMemo(() => {
    const chips = []
    const p = PERIOD_OPTIONS.find((o) => o.value === period)
    if (p && period !== 'active') {
      chips.push({ key: 'period', label: p.label, onRemove: () => setPeriod('active') })
    }
    selectedDrivers.forEach((id) => {
      const d = drivers.find((dr) => dr.id === id)
      if (d) {
        chips.push({
          key: `driver-${id}`,
          label: d.name,
          onRemove: () => setSelectedDrivers((prev) => prev.filter((x) => x !== id)),
        })
      }
    })
    selectedStatuses.forEach((s) => {
      const cfg = STATUS_CONFIG[s]
      if (cfg) {
        chips.push({
          key: `status-${s}`,
          label: cfg.label,
          onRemove: () => setSelectedStatuses((prev) => prev.filter((x) => x !== s)),
        })
      }
    })
    return chips
  }, [period, selectedDrivers, selectedStatuses, drivers])

  const clearAllFilters = () => {
    setPeriod('active')
    setCustomStart('')
    setCustomEnd('')
    setSelectedDrivers([])
    setSelectedStatuses([])
    setSearchQuery('')
  }

  const toggleDriver = (id) => {
    setSelectedDrivers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((x) => x !== status) : [...prev, status]
    )
  }

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Viajes</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost flex items-center gap-2"
          >
            <span className="material-icons text-lg">filter_list</span>
            Filtros
          </button>
          <button
            onClick={() => setShowNewTrip(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <span className="material-icons text-lg">add</span>
            Nuevo Viaje
          </button>
        </div>
      </header>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        {sidebarOpen && (
          <div className="w-[260px] shrink-0">
            <div className="bg-white rounded-xl shadow-card p-5 sticky top-24">
              {/* Search */}
              <div className="relative mb-5">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-200 border-none rounded text-sm placeholder:text-neutral-500 focus:ring-2 focus:ring-primary-main/20 focus:bg-white"
                />
              </div>

              {/* Period */}
              <div className="mb-5">
                <label className="block text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-2">
                  Periodo
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-neutral-200 border-none rounded py-2.5 px-3 text-sm text-neutral-900 focus:ring-2 focus:ring-primary-main/20"
                >
                  {PERIOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {period === 'custom' && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="flex-1 bg-neutral-200 border-none rounded py-2 px-2 text-xs focus:ring-2 focus:ring-primary-main/20"
                    />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="flex-1 bg-neutral-200 border-none rounded py-2 px-2 text-xs focus:ring-2 focus:ring-primary-main/20"
                    />
                  </div>
                )}
              </div>

              {/* Status filter */}
              {availableStatuses.length > 0 && (
                <div className="mb-5">
                  <label className="block text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-2">
                    Estado
                  </label>
                  <div className="flex flex-col gap-1">
                    {availableStatuses.map((s) => {
                      const cfg = STATUS_CONFIG[s] || { label: s, color: 'bg-neutral-500' }
                      const active = selectedStatuses.includes(s)
                      return (
                        <button
                          key={s}
                          onClick={() => toggleStatus(s)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all text-left ${
                            active
                              ? 'bg-primary-subtle text-primary-main font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Driver filter */}
              {availableDrivers.length > 0 && (
                <div className="mb-5">
                  <label className="block text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-2">
                    Chofer
                  </label>
                  <div className="flex flex-col gap-1">
                    {availableDrivers.map((d) => {
                      const active = selectedDrivers.includes(d.id)
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleDriver(d.id)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all text-left ${
                            active
                              ? 'bg-primary-subtle text-primary-main font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                            {d.name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                          {d.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Clear filters */}
              {activeChips.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full text-sm text-neutral-600 hover:text-error-main transition-colors py-2"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-subtle text-primary-main rounded text-[13px] font-semibold"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="hover:text-primary-dark transition-colors ml-0.5"
                  >
                    <span className="material-icons text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-error-light text-error-main rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="material-icons text-lg">error_outline</span>
              {error}
            </div>
          )}

          {/* Table card */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16 text-neutral-500">
                <span className="material-icons animate-spin text-2xl mr-3">progress_activity</span>
                Cargando viajes...
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredTrips.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-4">
                  <span className="material-icons text-3xl text-neutral-500">route</span>
                </div>
                <p className="text-neutral-900 font-semibold mb-1">Sin viajes</p>
                <p className="text-neutral-500 text-sm max-w-sm">
                  No hay viajes con estos filtros. Intenta ampliar el rango de fechas o crear un nuevo viaje.
                </p>
              </div>
            )}

            {/* Table */}
            {!loading && filteredTrips.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-neutral-200">
                      <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Chofer</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Ruta</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider text-right">Gastos</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map((trip) => {
                      const driver = drivers.find((d) => d.id === trip.driver_id)
                      const status = trip.status || 'in_progress'
                      const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_progress
                      return (
                        <tr
                          key={trip.id}
                          onClick={() => navigate(`/viaje/${trip.id}`)}
                          className="border-b border-neutral-200/60 hover:bg-neutral-200/50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                            {formatDate(trip.start_date || trip.load_date)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-[11px] font-bold text-neutral-600 shrink-0">
                                {driver?.name?.[0]?.toUpperCase() ?? '?'}
                              </span>
                              <span className="font-medium text-neutral-900">
                                {driver?.name ?? '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-900">
                            {trip.origin_name} <span className="text-neutral-400 mx-1">→</span> {trip.destination_name}
                          </td>
                          <td className="px-6 py-4 text-neutral-600">
                            {trip.delivery_client || trip.load_company || '—'}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-neutral-900 tabular-nums">
                            {formatMoney(trip.total_expense ?? 0)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block w-2.5 h-2.5 rounded-full ${statusCfg.color}`}
                              title={statusCfg.label}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            {!loading && filteredTrips.length > 0 && (
              <div className="px-6 py-3 border-t border-neutral-200/60 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {filteredTrips.length} viaje{filteredTrips.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewTripModal
        open={showNewTrip}
        onClose={() => setShowNewTrip(false)}
        onCreated={loadData}
      />
    </>
  )
}
