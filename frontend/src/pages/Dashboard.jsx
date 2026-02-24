import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getTrips, getDrivers } from '../api'
import NewTripModal from './NewTrip'

function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) +
    ', ' + date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(n))
}

export default function Dashboard() {
  const [trips, setTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    driver_id: '',
    status: '',
  })

  const loadData = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    async function load() {
      try {
        const [tripsRes, driversRes] = await Promise.all([
          getTrips(filters).catch(() => []),
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
  }, [filters.start_date, filters.end_date, filters.driver_id, filters.status])

  useEffect(() => {
    return loadData()
  }, [loadData])

  const totalTrips = trips.length
  const totalExpense = trips.reduce((sum, t) => sum + Number(t.total_expense ?? 0), 0)
  const totalIncome = trips.reduce((sum, t) => sum + Number(t.total_income ?? 0), 0)

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setFilters((f) => ({ ...f, status }))
  }

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard de Control de Viajes</h1>
          <p className="text-slate-500 text-sm">Resumen operativo y financiero del día</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <span className="material-icons text-sm">download</span>
            Exportar Reporte
          </button>
          <button onClick={() => setShowNewTrip(true)} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <span className="material-icons text-sm">add</span>
            Nuevo Viaje
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-icons">route</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total de Viajes</h3>
          <p className="text-3xl font-bold">{totalTrips}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
              <span className="material-icons">payments</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Gastos Totales</h3>
          <p className="text-3xl font-bold">{formatMoney(totalExpense)} <span className="text-sm font-normal text-slate-400">MXN</span></p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <span className="material-icons">trending_up</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Ingresos Netos</h3>
          <p className="text-3xl font-bold text-emerald-600">{formatMoney(totalIncome)} <span className="text-sm font-normal text-slate-400">MXN</span></p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Fecha Inicio</label>
          <div className="relative">
            <input
              className="w-full bg-slate-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 ring-primary"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
            />
            <span className="material-icons absolute left-3 top-2 text-slate-400 text-base">calendar_today</span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Fecha Fin</label>
          <div className="relative">
            <input
              className="w-full bg-slate-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 ring-primary"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
            />
            <span className="material-icons absolute left-3 top-2 text-slate-400 text-base">calendar_today</span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Conductor</label>
          <select
            className="w-full bg-slate-50 border-none rounded-lg py-2 px-4 text-sm focus:ring-2 ring-primary appearance-none"
            value={filters.driver_id}
            onChange={(e) => setFilters((f) => ({ ...f, driver_id: e.target.value }))}
          >
            <option value="">Todos los conductores</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Estado del Viaje</label>
          <div className="flex bg-slate-50 p-1 rounded-lg">
            <button
              onClick={() => handleStatusFilter('')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${statusFilter === '' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => handleStatusFilter('in_progress')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${statusFilter === 'in_progress' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Activo
            </button>
            <button
              onClick={() => handleStatusFilter('closed')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${statusFilter === 'closed' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Finalizado
            </button>
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-slate-500">Cargando viajes…</div>
      )}

      {/* Empty State */}
      {!loading && trips.length === 0 && !error && (
        <div className="text-center py-12 text-slate-500">
          No hay viajes con los filtros seleccionados.
        </div>
      )}

      {/* Data Table */}
      {!loading && trips.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">Viajes Recientes</h2>
              <p className="text-slate-500 text-xs mt-1">Historial completo de trayectos y balances financieros</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID Viaje</th>
                  <th className="px-6 py-4">Operador</th>
                  <th className="px-6 py-4">Ruta (Origen - Destino)</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Gasto</th>
                  <th className="px-6 py-4">Ingreso</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((trip) => {
                  const balance = Number(trip.total_income ?? 0) - Number(trip.total_expense ?? 0)
                  const driver = drivers.find((d) => d.id === trip.driver_id)
                  const isClosed = trip.status === 'closed'
                  return (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/viaje/${trip.id}`} className="font-mono font-bold text-primary hover:underline">
                          #{trip.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{driver?.name ?? '—'}</td>
                      <td className="px-6 py-4">{trip.origin_name} → {trip.destination_name}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(trip.start_date)}</td>
                      <td className="px-6 py-4 text-rose-500 font-medium">{formatMoney(trip.total_expense)}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">{formatMoney(trip.total_income)}</td>
                      <td className={`px-6 py-4 font-semibold ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {balance >= 0 ? '+' : ''}{formatMoney(balance)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isClosed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isClosed ? 'Finalizado' : 'En curso'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {trips.length} registros
            </span>
          </div>
        </section>
      )}

      <NewTripModal
        open={showNewTrip}
        onClose={() => setShowNewTrip(false)}
        onCreated={loadData}
      />
    </>
  )
}
