import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, getDrivers, approveMovement } from '../api'
import RejectMovementModal from './RejectMovementModal'
import EvidenceGalleryModal from './EvidenceGalleryModal'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))
}

const EXPENSE_ICONS = {
  combustible: { icon: 'local_gas_station', bg: 'bg-blue-50', text: 'text-blue-600' },
  diesel: { icon: 'local_gas_station', bg: 'bg-blue-50', text: 'text-blue-600' },
  caseta: { icon: 'toll', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  peaje: { icon: 'toll', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  viatico: { icon: 'restaurant', bg: 'bg-orange-50', text: 'text-orange-600' },
  alimento: { icon: 'restaurant', bg: 'bg-orange-50', text: 'text-orange-600' },
  comida: { icon: 'restaurant', bg: 'bg-orange-50', text: 'text-orange-600' },
  hospedaje: { icon: 'hotel', bg: 'bg-purple-50', text: 'text-purple-600' },
  hotel: { icon: 'hotel', bg: 'bg-purple-50', text: 'text-purple-600' },
  mantenimiento: { icon: 'build', bg: 'bg-amber-50', text: 'text-amber-600' },
  reparacion: { icon: 'build', bg: 'bg-amber-50', text: 'text-amber-600' },
}

function getExpenseStyle(concept) {
  const lower = (concept || '').toLowerCase()
  for (const [key, style] of Object.entries(EXPENSE_ICONS)) {
    if (lower.includes(key)) return style
  }
  return { icon: 'receipt_long', bg: 'bg-slate-50', text: 'text-slate-600' }
}

export default function TripDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [galleryIndex, setGalleryIndex] = useState(null)

  const loadTrip = useCallback(async () => {
    try {
      const [tripData, driversData] = await Promise.all([
        getTrip(id),
        getDrivers().catch(() => []),
      ])
      setTrip(tripData)
      const drivers = Array.isArray(driversData) ? driversData : driversData?.items ?? []
      setDriver(drivers.find((d) => d.id === tripData.driver_id) ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    loadTrip().then(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [loadTrip])

  function handleRejected() {
    setRejectTarget(null)
    loadTrip()
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Cargando detalle del viaje…</div>
  }

  if (error) {
    return <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">{error}</div>
  }

  if (!trip) {
    return <div className="text-center py-12 text-slate-500">Viaje no encontrado.</div>
  }

  const movements = trip.movements ?? []
  const income = movements.filter((m) => m.type === 'income')
  const expense = movements.filter((m) => m.type === 'expense')
  const totalIncome = Number(trip.total_income ?? income.reduce((s, m) => s + Number(m.amount), 0))
  const totalExpense = Number(trip.total_expense ?? expense.reduce((s, m) => s + Number(m.amount), 0))
  const balance = totalIncome - totalExpense
  const marginPct = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0'
  const isClosed = trip.status === 'closed'
  const folio = trip.folio || id.slice(0, 8)

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/" className="hover:text-brand-teal-accent transition-colors">Panel de Control</Link>
            <span className="material-icons text-xs">chevron_right</span>
            <Link to="/" className="hover:text-brand-teal-accent transition-colors">Viajes Activos</Link>
            <span className="material-icons text-xs">chevron_right</span>
            <span className="text-slate-900 font-medium">Folio #{folio}</span>
          </nav>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Detalle de Liquidación Simplificado</h1>

          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isClosed
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isClosed ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              {isClosed ? 'Finalizado' : 'En Tránsito'}
            </span>
            <span className="text-slate-500 text-sm">•</span>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-1">
              <span className="material-icons text-sm">route</span>
              Ruta: {trip.origin_name} a {trip.destination_name}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <span className="material-icons text-lg">print</span>
            Imprimir
          </button>
          {!isClosed && (
            <button className="flex-1 md:flex-none px-6 py-2.5 bg-brand-teal-accent text-white text-sm font-bold rounded-lg hover:bg-brand-teal-accent/90 transition-all shadow-sm shadow-brand-teal-accent/20 flex items-center justify-center gap-2" disabled>
              <span className="material-icons text-lg">check_circle</span>
              Cerrar Viaje
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Ingresos Totales */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-sm font-medium">Ingresos Totales (Flete)</p>
            <div className="text-brand-teal-accent bg-brand-teal-accent/10 p-1.5 rounded-lg">
              <span className="material-icons">payments</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(totalIncome)} <span className="text-xs font-normal text-slate-400">MXN</span></p>
          {income.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
              <span className="material-icons text-xs">trending_up</span>
              <span>{income.length} movimiento{income.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Gastos Chofer */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-sm font-medium">Gastos Chofer (Reportados)</p>
            <div className="text-amber-500 bg-amber-500/10 p-1.5 rounded-lg">
              <span className="material-icons">receipt_long</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(totalExpense)} <span className="text-xs font-normal text-slate-400">MXN</span></p>
          <p className="text-slate-400 text-xs mt-2">{expense.length} gasto{expense.length !== 1 ? 's' : ''} reportado{expense.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Utilidad Neta Estimada */}
        <div className="bg-brand-teal-accent text-white p-6 rounded-xl border border-brand-teal-accent shadow-lg shadow-brand-teal-accent/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm font-medium">Utilidad Neta Estimada</p>
            <div className="bg-white/20 p-1.5 rounded-lg">
              <span className="material-icons">account_balance_wallet</span>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatMoney(balance)} <span className="text-xs font-normal text-white/60">MXN</span></p>
          <div className="flex items-center gap-1 mt-2 text-white/90 text-xs font-bold">
            <span className="material-icons text-xs">verified</span>
            <span>{marginPct}% Margen Operativo</span>
          </div>
        </div>
      </section>

      {/* Main content: 4/8 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Operator Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <span className="material-icons text-brand-teal-accent">person</span>
              <h3 className="font-bold text-slate-900">Información del Operador</h3>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <span className="material-icons text-2xl">person</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">{driver?.name ?? '—'}</p>
                <p className="text-xs text-slate-500">ID: #{driver?.id?.slice(0, 8) ?? '—'}</p>
              </div>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unidad</p>
                <p className="text-sm font-semibold text-slate-700">{trip.truck || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Remolque</p>
                <p className="text-sm font-semibold text-slate-700">{trip.trailer || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Expenses Table */}
        <div className="lg:col-span-8 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">Gastos del Chofer</h2>
              </div>
              <button className="text-brand-teal-accent text-sm font-semibold flex items-center gap-1 hover:underline" disabled>
                <span className="material-icons text-lg">add_box</span>
                Registrar Gasto Manual
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Concepto</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Monto</th>
                      <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Evidencia</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expense.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                          Sin gastos registrados
                        </td>
                      </tr>
                    )}
                    {expense.map((m) => {
                      const style = getExpenseStyle(m.concept)
                      const status = m.evidence_status || 'pending'
                      const statusConfig = {
                        pending: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-700' },
                        approved: { label: 'Aprobado', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                        rejected: { label: 'Rechazado', bg: 'bg-red-50', text: 'text-red-700' },
                      }
                      const st = statusConfig[status] || statusConfig.pending
                      const evidenceItems = expense.filter((e) => e.evidence_url)
                      const galleryIdx = m.evidence_url ? evidenceItems.findIndex((e) => e.id === m.id) : -1
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded ${style.bg} flex items-center justify-center ${style.text}`}>
                                <span className="material-icons text-lg">{style.icon}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-slate-700">{m.concept}</span>
                                {status === 'rejected' && m.rejection_reason && (
                                  <p className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate" title={m.rejection_reason}>
                                    <span className="material-icons text-xs align-middle mr-0.5">info</span>
                                    {m.rejection_reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(m.movement_date)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatMoney(m.amount)}</td>
                          <td className="px-4 py-4 text-center">
                            {m.evidence_url ? (
                              <button
                                onClick={() => setGalleryIndex(galleryIdx)}
                                className="group relative inline-block rounded-lg overflow-hidden border-2 border-slate-200 hover:border-brand-teal-accent transition-colors"
                              >
                                <img
                                  src={m.evidence_url}
                                  alt={`Evidencia: ${m.concept}`}
                                  className="w-10 h-10 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <span className="material-icons text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                                </div>
                              </button>
                            ) : (
                              <span className="text-slate-300">
                                <span className="material-icons text-lg">hide_image</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {status === 'pending' && !isClosed && (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await approveMovement(id, m.id)
                                      loadTrip()
                                    } catch {}
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                                  title="Aprobar"
                                >
                                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                                </button>
                                <button
                                  onClick={() => setRejectTarget(m)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                                  title="Rechazar"
                                >
                                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {expense.length > 0 && (
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900" colSpan={2}>Subtotal Gastos</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{formatMoney(totalExpense)}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </section>

          {/* Liquidación Final */}
          <div className="bg-brand-teal-accent/5 border border-brand-teal-accent/20 p-6 rounded-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="font-bold text-brand-teal-accent">Liquidación Final {isClosed ? '' : 'Pendiente'}</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Este monto representa lo que el chofer debe reintegrar o cobrar tras comprobar sus gastos contra el anticipo otorgado.
                </p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Chofer</p>
                  <p className="text-2xl font-black text-slate-900">
                    {formatMoney(Math.abs(balance))}{' '}
                    <span className="text-xs font-normal">{balance >= 0 ? 'A FAVOR' : 'EN CONTRA'}</span>
                  </p>
                </div>
                <button className="px-6 py-3 bg-white text-brand-teal-accent border border-brand-teal-accent/30 rounded-lg font-bold text-sm shadow-sm hover:bg-brand-teal-accent hover:text-white transition-all" disabled>
                  Reconciliar Cuentas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RejectMovementModal
        open={!!rejectTarget}
        movement={rejectTarget}
        tripId={id}
        onClose={() => setRejectTarget(null)}
        onRejected={handleRejected}
      />

      <EvidenceGalleryModal
        open={galleryIndex !== null}
        items={expense.filter((e) => e.evidence_url)}
        startIndex={galleryIndex ?? 0}
        onClose={() => setGalleryIndex(null)}
      />
    </>
  )
}
