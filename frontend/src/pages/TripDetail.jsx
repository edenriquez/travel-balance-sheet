import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, getDrivers, approveMovement, closeTrip, addMovement } from '../api'
import useEscapeKey from '../hooks/useEscapeKey'
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
  combustible: { icon: 'local_gas_station', bg: 'bg-info-main/10', text: 'text-info-main' },
  diesel: { icon: 'local_gas_station', bg: 'bg-info-main/10', text: 'text-info-main' },
  caseta: { icon: 'toll', bg: 'bg-primary-subtle', text: 'text-primary-main' },
  peaje: { icon: 'toll', bg: 'bg-primary-subtle', text: 'text-primary-main' },
  viatico: { icon: 'restaurant', bg: 'bg-warning-subtle', text: 'text-warning-dark' },
  alimento: { icon: 'restaurant', bg: 'bg-warning-subtle', text: 'text-warning-dark' },
  comida: { icon: 'restaurant', bg: 'bg-warning-subtle', text: 'text-warning-dark' },
  hospedaje: { icon: 'hotel', bg: 'bg-error-subtle', text: 'text-error-main' },
  hotel: { icon: 'hotel', bg: 'bg-error-subtle', text: 'text-error-main' },
  mantenimiento: { icon: 'build', bg: 'bg-warning-subtle', text: 'text-warning-dark' },
  reparacion: { icon: 'build', bg: 'bg-warning-subtle', text: 'text-warning-dark' },
}

function getExpenseStyle(concept) {
  const lower = (concept || '').toLowerCase()
  for (const [key, style] of Object.entries(EXPENSE_ICONS)) {
    if (lower.includes(key)) return style
  }
  return { icon: 'receipt_long', bg: 'bg-neutral-200', text: 'text-neutral-600' }
}

export default function TripDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewConcept, setReviewConcept] = useState('')
  const [reviewAmount, setReviewAmount] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [galleryIndex, setGalleryIndex] = useState(null)
  const [approvedFlash, setApprovedFlash] = useState(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeNotes, setCloseNotes] = useState('')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    type: 'expense',
    concept: '',
    amount: '',
    currency: 'MXN',
    movement_date: new Date().toISOString().split('T')[0],
    evidence: null,
  })
  const [evidencePreview, setEvidencePreview] = useState(null)
  const [addingExpense, setAddingExpense] = useState(false)
  const [addExpenseError, setAddExpenseError] = useState('')

  useEscapeKey(() => setConfirmClose(false), confirmClose)
  useEscapeKey(() => { resetExpenseForm(); setShowAddExpense(false) }, showAddExpense && !confirmClose)
  useEscapeKey(() => setReviewTarget(null), !!reviewTarget)

  const loadTrip = useCallback(async () => {
    try {
      const [tripData, driversData] = await Promise.all([
        getTrip(id),
        getDrivers().catch(() => []),
      ])
      setTrip(tripData)
      const driversList = Array.isArray(driversData) ? driversData : driversData?.items ?? []
      setDriver(driversList.find((d) => d.id === tripData.driver_id) ?? null)
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

  async function handleApprove(movementId, overrides = null) {
    try {
      await approveMovement(id, movementId, overrides)
      setApprovedFlash(movementId)
      setTimeout(() => setApprovedFlash(null), 600)
      loadTrip()
    } catch {}
  }

  function openReview(m) {
    setReviewTarget(m)
    setReviewConcept(m.concept || '')
    setReviewAmount(Number(m.amount) > 0 ? String(m.amount) : '')
    setReviewError('')
  }

  async function handleReviewApprove() {
    if (!reviewTarget) return
    const amt = Number(reviewAmount)
    if (!reviewConcept.trim()) { setReviewError('El concepto es obligatorio'); return }
    if (!Number.isFinite(amt) || amt <= 0) { setReviewError('Ingresa un monto válido mayor a 0'); return }
    setReviewSaving(true)
    setReviewError('')
    try {
      await approveMovement(id, reviewTarget.id, {
        concept: reviewConcept.trim(),
        amount: amt,
      })
      setApprovedFlash(reviewTarget.id)
      setTimeout(() => setApprovedFlash(null), 600)
      setReviewTarget(null)
      await loadTrip()
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setReviewSaving(false)
    }
  }

  async function handleCloseTrip() {
    setClosing(true)
    try {
      await closeTrip(id, { notes: closeNotes })
      await loadTrip()
      setConfirmClose(false)
      setCloseNotes('')
    } catch (e) {
      setError(e.message)
    } finally {
      setClosing(false)
    }
  }

  function resetExpenseForm() {
    setExpenseForm({ type: 'expense', concept: '', amount: '', currency: 'MXN', movement_date: new Date().toISOString().split('T')[0], evidence: null })
    setEvidencePreview(null)
    setAddExpenseError('')
  }

  function handleEvidenceChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setExpenseForm((f) => ({ ...f, evidence: file }))
    const reader = new FileReader()
    reader.onload = (ev) => setEvidencePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function removeEvidence() {
    setExpenseForm((f) => ({ ...f, evidence: null }))
    setEvidencePreview(null)
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    const { type, concept, amount, currency, movement_date, evidence } = expenseForm
    if (!concept.trim() || !amount || !movement_date) return
    setAddingExpense(true)
    setAddExpenseError('')
    try {
      await addMovement(id, { type, concept: concept.trim(), amount: Number(amount), currency, movement_date, evidence })
      resetExpenseForm()
      setShowAddExpense(false)
      await loadTrip()
    } catch (err) {
      setAddExpenseError(err.message)
    } finally {
      setAddingExpense(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-500">
        <span className="material-icons animate-spin text-2xl mr-3">progress_activity</span>
        Cargando detalle del viaje...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-error-light text-error-main rounded-xl text-sm font-medium flex items-center gap-2">
        <span className="material-icons text-lg">error_outline</span>
        {error}
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
        <span className="material-icons text-4xl mb-2">search_off</span>
        Viaje no encontrado
      </div>
    )
  }

  const movements = trip.movements ?? []
  const income = movements.filter((m) => m.type === 'income')
  const expense = movements.filter((m) => m.type === 'expense')
  const totalIncome = Number(trip.total_income ?? income.reduce((s, m) => s + Number(m.amount), 0))
  const totalExpense = Number(trip.total_expense ?? expense.reduce((s, m) => s + Number(m.amount), 0))
  const balance = totalIncome - totalExpense
  const isClosed = trip.status === 'closed'
  const folio = trip.folio || id.slice(0, 8)

  // Group expenses by category for summary
  const expenseByCategory = expense.reduce((acc, m) => {
    const cat = m.concept || 'Otro'
    acc[cat] = (acc[cat] || 0) + Number(m.amount)
    return acc
  }, {})

  return (
    <>
      {/* Breadcrumb + header */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
        <Link to="/" className="hover:text-primary-main transition-colors">Viajes</Link>
        <span className="material-icons text-xs">chevron_right</span>
        <span className="text-neutral-900 font-medium">Folio #{folio}</span>
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
            {trip.origin_name} → {trip.destination_name}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
              isClosed
                ? 'bg-success-light text-success-main'
                : 'bg-info-light text-info-main'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-success-main' : 'bg-info-main'}`} />
              {isClosed ? 'Completado' : 'En Transito'}
            </span>
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {driver?.name ?? '—'} &middot; {trip.delivery_client || trip.load_company || '—'} &middot; {formatDate(trip.start_date || trip.load_date)}
          </p>
        </div>
        <div className="flex gap-2">
          {!isClosed && (
            <button
              onClick={() => setConfirmClose(true)}
              className="btn btn-soft flex items-center gap-2"
            >
              <span className="material-icons text-lg">check_circle</span>
              Cerrar Viaje
            </button>
          )}
        </div>
      </div>

      {/* Notes (shown when trip has notes) */}
      {trip.notes && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-neutral-200/60 border border-neutral-300/50 px-5 py-4">
          <span className="material-icons text-neutral-500 text-lg mt-0.5">sticky_note_2</span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1px] text-neutral-500 mb-1">Notas</p>
            <p className="text-sm text-neutral-700 whitespace-pre-line">{trip.notes}</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Expense breakdown */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-4">Desglose de Gastos</h3>
          <p className="text-2xl font-bold text-neutral-900 mb-4">{formatMoney(totalExpense)}</p>
          <div className="space-y-2.5">
            {Object.entries(expenseByCategory).map(([cat, amount]) => {
              const style = getExpenseStyle(cat)
              const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${style.bg} ${style.text}`}>
                    <span className="material-icons text-base">{style.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-700 font-medium capitalize">{cat}</span>
                      <span className="text-neutral-900 font-semibold tabular-nums">{formatMoney(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-main rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {Object.keys(expenseByCategory).length === 0 && (
              <p className="text-neutral-500 text-sm">Sin gastos registrados</p>
            )}
          </div>
        </div>

        {/* Revenue vs Expense */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-4">Resumen Financiero</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Flete (Ingreso)</span>
              <span className="text-lg font-semibold text-neutral-900 tabular-nums">{formatMoney(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Gastos totales</span>
              <span className="text-lg font-semibold text-neutral-900 tabular-nums">- {formatMoney(totalExpense)}</span>
            </div>
            <div className="border-t border-neutral-300 pt-4 flex justify-between items-center">
              <span className="text-sm font-bold text-neutral-900">Neto</span>
              <span className={`text-2xl font-bold tabular-nums ${balance >= 0 ? 'text-primary-main' : 'text-error-main'}`}>
                {formatMoney(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
          <h2 className="font-bold text-neutral-900">Gastos del Viaje</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">{expense.length} gasto{expense.length !== 1 ? 's' : ''}</span>
            {!isClosed && (
              <button
                onClick={() => setShowAddExpense(true)}
                className="btn btn-primary flex items-center gap-2 text-sm"
              >
                <span className="material-icons text-lg">add</span>
                Agregar Movimiento
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-neutral-200">
                <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Concepto</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider text-right">Monto</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider text-center">Ticket</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expense.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 text-sm">
                    Sin gastos registrados
                  </td>
                </tr>
              )}
              {expense.map((m) => {
                const style = getExpenseStyle(m.concept)
                const status = m.evidence_status || 'pending'
                const statusConfig = {
                  pending: { label: 'Pendiente', bg: 'bg-warning-light', text: 'text-warning-dark' },
                  approved: { label: 'Aprobado', bg: 'bg-success-light', text: 'text-success-main' },
                  rejected: { label: 'Rechazado', bg: 'bg-error-light', text: 'text-error-main' },
                }
                const st = statusConfig[status] || statusConfig.pending
                const evidenceItems = expense.filter((e) => e.evidence_url)
                const galleryIdx = m.evidence_url ? evidenceItems.findIndex((e) => e.id === m.id) : -1
                const isFlashing = approvedFlash === m.id
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-neutral-200/60 hover:bg-neutral-200/50 transition-all ${
                      isFlashing ? 'bg-primary-subtle' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${style.bg} ${style.text}`}>
                          <span className="material-icons text-base">{style.icon}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-neutral-900">{m.concept}</span>
                          {status === 'rejected' && m.rejection_reason && (
                            <p className="text-xs text-error-main mt-0.5 max-w-[200px] truncate" title={m.rejection_reason}>
                              {m.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{formatDate(m.movement_date)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-neutral-900 tabular-nums">{formatMoney(m.amount)}</td>
                    <td className="px-4 py-4 text-center">
                      {m.evidence_url ? (
                        m.evidence_type === 'audio' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); openReview(m) }}
                            className="inline-flex items-center justify-center w-10 h-10 rounded border-2 border-neutral-300 hover:border-primary-main bg-neutral-100 text-primary-main transition-colors"
                            title="Nota de voz"
                          >
                            <span className="material-icons">mic</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex(galleryIdx) }}
                            className="group relative inline-block rounded overflow-hidden border-2 border-neutral-300 hover:border-primary-main transition-colors"
                          >
                            <img src={m.evidence_url} alt={`Evidencia: ${m.concept}`} className="w-10 h-10 object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <span className="material-icons text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                            </div>
                          </button>
                        )
                      ) : (
                        <span className="text-neutral-400">
                          <span className="material-icons text-lg">hide_image</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {status === 'pending' && !isClosed && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); openReview(m) }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-primary-main hover:bg-primary-subtle transition-all"
                            title="Revisar y aprobar"
                          >
                            <span className="material-icons text-base">fact_check</span>
                            Revisar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRejectTarget(m) }}
                            className="w-8 h-8 flex items-center justify-center rounded text-neutral-400 hover:bg-error-subtle hover:text-error-main transition-all"
                            title="Rechazar"
                          >
                            <span className="material-icons text-lg">close</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {expense.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-200">
                  <td className="px-6 py-3.5 text-sm font-bold text-neutral-900" colSpan={2}>
                    Total Gastos
                  </td>
                  <td className="px-6 py-3.5 text-sm font-bold text-neutral-900 text-right tabular-nums">
                    {formatMoney(totalExpense)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
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

      {/* Add movement modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-dropdown overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-300/50 px-6 py-4">
              <h3 className="text-lg font-bold text-neutral-900">Agregar Movimiento</h3>
              <button onClick={() => { resetExpenseForm(); setShowAddExpense(false) }} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <form id="add-movement-form" className="space-y-4" onSubmit={handleAddExpense}>
                {/* Type toggle */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Tipo</label>
                  <div className="flex rounded border border-neutral-300 overflow-hidden w-fit">
                    {[
                      { value: 'expense', label: 'Gasto', icon: 'trending_down' },
                      { value: 'income', label: 'Ingreso', icon: 'trending_up' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExpenseForm((f) => ({ ...f, type: opt.value }))}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all ${
                          expenseForm.type === opt.value
                            ? opt.value === 'expense'
                              ? 'bg-error-light text-error-main'
                              : 'bg-primary-subtle text-primary-main'
                            : 'bg-white text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        <span className="material-icons text-lg">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Concept */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Concepto</label>
                  <input
                    type="text"
                    value={expenseForm.concept}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, concept: e.target.value }))}
                    placeholder="ej. Caseta, Diesel, Herramienta, Viaticos..."
                    className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                    autoFocus
                  />
                </div>

                {/* Amount + Currency + Date */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Monto</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="0.00"
                        className="w-full rounded border border-neutral-300 bg-white pl-7 pr-3 py-2.5 text-sm tabular-nums focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Moneda</label>
                    <select
                      value={expenseForm.currency}
                      onChange={(e) => setExpenseForm((f) => ({ ...f, currency: e.target.value }))}
                      className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                    >
                      <option value="MXN">MXN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Fecha</label>
                    <input
                      type="date"
                      value={expenseForm.movement_date}
                      onChange={(e) => setExpenseForm((f) => ({ ...f, movement_date: e.target.value }))}
                      className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                    />
                  </div>
                </div>

                {/* Evidence upload */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Evidencia (opcional)</label>
                  {evidencePreview ? (
                    <div className="flex items-center gap-3 p-3 rounded border border-neutral-300 bg-white">
                      <img src={evidencePreview} alt="Preview" className="w-14 h-14 object-cover rounded border border-neutral-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{expenseForm.evidence?.name}</p>
                        <p className="text-xs text-neutral-500">
                          {(expenseForm.evidence?.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeEvidence}
                        className="w-8 h-8 flex items-center justify-center rounded text-neutral-400 hover:bg-error-subtle hover:text-error-main transition-all"
                      >
                        <span className="material-icons text-lg">delete</span>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 p-5 rounded border-2 border-dashed border-neutral-300 bg-white cursor-pointer hover:border-primary-main hover:bg-primary-subtle/20 transition-all">
                      <span className="material-icons text-2xl text-neutral-400">cloud_upload</span>
                      <span className="text-xs text-neutral-500">
                        Arrastra una imagen o <span className="text-primary-main font-semibold">haz clic para seleccionar</span>
                      </span>
                      <span className="text-[10px] text-neutral-400">JPG, PNG o WebP — max 10 MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleEvidenceChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Error */}
                {addExpenseError && (
                  <div className="p-3 bg-error-light text-error-main rounded text-sm font-medium">{addExpenseError}</div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-neutral-300/50 bg-neutral-100 px-6 py-4">
              <button onClick={() => { resetExpenseForm(); setShowAddExpense(false) }} disabled={addingExpense} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                type="submit"
                form="add-movement-form"
                disabled={addingExpense || !expenseForm.concept.trim() || !expenseForm.amount || !expenseForm.movement_date}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingExpense ? (
                  <>
                    <span className="material-icons animate-spin text-lg">progress_activity</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-icons text-lg">add</span>
                    Agregar Movimiento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & approve modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-dropdown overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-300/50 px-6 py-4">
              <h3 className="text-lg font-bold text-neutral-900">Revisar Movimiento</h3>
              <button onClick={() => setReviewTarget(null)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              {/* Media viewer */}
              {reviewTarget.evidence_url ? (
                reviewTarget.evidence_type === 'audio' ? (
                  <div className="rounded border border-neutral-300 bg-neutral-100 p-4 flex items-center gap-3">
                    <span className="material-icons text-primary-main text-2xl">mic</span>
                    <audio controls src={reviewTarget.evidence_url} className="flex-1" />
                  </div>
                ) : (
                  <div className="rounded border border-neutral-300 bg-neutral-100 overflow-hidden">
                    <img src={reviewTarget.evidence_url} alt="Evidencia" className="w-full max-h-80 object-contain bg-neutral-900" />
                  </div>
                )
              ) : (
                <div className="rounded border border-neutral-300 bg-neutral-100 p-6 text-center text-neutral-500 text-sm">
                  Sin evidencia adjunta
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Concepto</label>
                <input
                  type="text"
                  value={reviewConcept}
                  onChange={(e) => setReviewConcept(e.target.value)}
                  placeholder="ej. Diesel, Caseta, Viaticos..."
                  className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={reviewAmount}
                    onChange={(e) => setReviewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded border border-neutral-300 bg-white pl-7 pr-3 py-2.5 text-sm tabular-nums focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                  />
                </div>
              </div>

              {reviewError && (
                <div className="p-3 bg-error-light text-error-main rounded text-sm font-medium">{reviewError}</div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-neutral-300/50 bg-neutral-100 px-6 py-4">
              <button
                onClick={() => { setRejectTarget(reviewTarget); setReviewTarget(null) }}
                disabled={reviewSaving}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-error-main hover:text-error-dark"
              >
                <span className="material-icons text-lg">block</span>
                Rechazar
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setReviewTarget(null)} disabled={reviewSaving} className="btn btn-ghost">
                  Cancelar
                </button>
                <button
                  onClick={handleReviewApprove}
                  disabled={reviewSaving || !reviewConcept.trim() || !reviewAmount}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewSaving ? (
                    <>
                      <span className="material-icons animate-spin text-lg">progress_activity</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-lg">check</span>
                      Aprobar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close trip confirmation */}
      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-md bg-white rounded-xl shadow-dropdown overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-300/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center">
                  <span className="material-icons text-primary-main">check_circle</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Cerrar Viaje</h3>
              </div>
              <button onClick={() => setConfirmClose(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm text-neutral-600">
                Estas a punto de cerrar el viaje <span className="font-bold text-neutral-900">Folio #{folio}</span>.
              </p>
              <p className="text-sm text-neutral-600 mt-2">
                Una vez cerrado, no se podran agregar ni aprobar mas gastos.
              </p>

              <div className="mt-4 rounded bg-neutral-100 border border-neutral-300/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Ruta</span>
                  <span className="font-medium text-neutral-900">{trip.origin_name} → {trip.destination_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Gastos</span>
                  <span className="font-medium text-neutral-900">{formatMoney(totalExpense)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Neto</span>
                  <span className={`font-bold ${balance >= 0 ? 'text-primary-main' : 'text-error-main'}`}>{formatMoney(balance)}</span>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Notas (opcional)</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  rows={3}
                  maxLength={2048}
                  className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20 resize-none"
                  placeholder="Observaciones sobre el viaje..."
                />
              </div>

              {expense.some((m) => (m.evidence_status || 'pending') === 'pending') && (
                <div className="mt-4 p-3 bg-warning-light text-warning-dark rounded text-sm font-medium flex items-center gap-2">
                  <span className="material-icons text-lg">warning</span>
                  Hay gastos pendientes de revision.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-neutral-300/50 bg-neutral-100 px-6 py-4">
              <button onClick={() => setConfirmClose(false)} disabled={closing} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                onClick={handleCloseTrip}
                disabled={closing}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {closing ? (
                  <>
                    <span className="material-icons animate-spin text-lg">progress_activity</span>
                    Cerrando...
                  </>
                ) : (
                  <>
                    <span className="material-icons text-lg">check_circle</span>
                    Confirmar Cierre
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
