import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  in_progress: { label: 'En curso', color: 'bg-info-main', icon: 'local_shipping' },
  closed: { label: 'Completado', color: 'bg-success-main', icon: 'check_circle' },
  pending_review: { label: 'Pendiente', color: 'bg-warning-main', icon: 'schedule' },
  with_rejections: { label: 'Con rechazos', color: 'bg-error-main', icon: 'error' },
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'closed', label: 'Completado' },
  { value: 'pending_review', label: 'Pendiente' },
  { value: 'with_rejections', label: 'Con rechazos' },
]

const PERIOD_OPTIONS = [
  { value: '', label: 'Todo el tiempo' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'custom', label: 'Rango personalizado' },
]

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

function DatePickerField({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const today = new Date()

  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  // Build calendar grid (Monday-start)
  const firstDay = new Date(viewYear, viewMonth, 1)
  const startDow = (firstDay.getDay() + 6) % 7 // 0=Mon
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function pick(day) {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const displayValue = selected
    ? selected.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs text-neutral-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 bg-neutral-200 rounded px-3 py-2 text-sm text-left transition-all ${
          open ? 'ring-2 ring-primary-main/20 bg-white' : 'hover:bg-neutral-300'
        }`}
      >
        <span className="material-icons text-neutral-500 text-base">calendar_today</span>
        <span className={displayValue ? 'text-neutral-900' : 'text-neutral-500'}>
          {displayValue || 'Seleccionar'}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-dropdown border border-neutral-200 p-3 animate-in fade-in slide-in-from-top-1">
          {/* Month/year nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-200 text-neutral-600 transition-colors"
            >
              <span className="material-icons text-base">chevron_left</span>
            </button>
            <span className="text-sm font-semibold text-neutral-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-200 text-neutral-600 transition-colors"
            >
              <span className="material-icons text-base">chevron_right</span>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-neutral-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = value === iso
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  className={`w-full aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-primary-main text-white shadow-sm'
                      : isToday
                        ? 'bg-primary-subtle text-primary-main font-bold'
                        : 'text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); pick(today.getDate()) }}
              className="w-full text-xs text-primary-main font-semibold hover:text-primary-dark transition-colors py-1"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Filter state
  const [statusFilter, setStatusFilter] = useState('in_progress')
  const [period, setPeriod] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedDrivers, setSelectedDrivers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const showPeriod = true

  // Build API filters
  const apiFilters = useMemo(() => {
    const f = {}
    if (statusFilter !== 'all') {
      f.status = statusFilter
    }
    if (showPeriod) {
      if (period === 'week') {
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
    }
    if (selectedDrivers.length === 1) {
      f.driver_id = selectedDrivers[0]
    }
    return f
  }, [statusFilter, showPeriod, period, customStart, customEnd, selectedDrivers])

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

  // Client-side filtering for multi-select drivers and search
  const filteredTrips = useMemo(() => {
    let result = trips
    if (selectedDrivers.length > 1) {
      result = result.filter((t) => selectedDrivers.includes(t.driver_id))
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
  }, [trips, selectedDrivers, searchQuery, drivers])

  // Derive filter options from current data
  const availableDrivers = useMemo(() => {
    const ids = [...new Set(trips.map((t) => t.driver_id))]
    return ids.map((id) => drivers.find((d) => d.id === id)).filter(Boolean)
  }, [trips, drivers])

  // Chip helpers
  const activeChips = useMemo(() => {
    const chips = []
    if (statusFilter !== 'in_progress') {
      const s = STATUS_OPTIONS.find((o) => o.value === statusFilter)
      if (s) chips.push({ key: 'status', label: s.label, onRemove: () => { setStatusFilter('in_progress'); setPeriod('') } })
    }
    if (showPeriod && period) {
      const p = PERIOD_OPTIONS.find((o) => o.value === period)
      if (p) chips.push({ key: 'period', label: p.label, onRemove: () => { setPeriod(''); setCustomStart(''); setCustomEnd('') } })
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
    return chips
  }, [statusFilter, showPeriod, period, selectedDrivers, drivers])

  const clearAllFilters = () => {
    setStatusFilter('in_progress')
    setPeriod('')
    setCustomStart('')
    setCustomEnd('')
    setSelectedDrivers([])
    setSearchQuery('')
  }

  const toggleDriver = (id) => {
    setSelectedDrivers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
                  <div className="mt-3 space-y-2">
                    <DatePickerField
                      label="Desde"
                      value={customStart}
                      onChange={setCustomStart}
                    />
                    <DatePickerField
                      label="Hasta"
                      value={customEnd}
                      onChange={setCustomEnd}
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mb-5">
                <label className="block text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-2">
                  Estado
                </label>
                <div className="flex flex-col gap-1">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = statusFilter === opt.value
                    const cfg = STATUS_CONFIG[opt.value]
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all text-left ${
                          active
                            ? 'bg-primary-subtle text-primary-main font-semibold'
                            : 'text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {cfg ? (
                          <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-neutral-400" />
                        )}
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

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
