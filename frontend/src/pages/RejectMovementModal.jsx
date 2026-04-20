import { useState } from 'react'
import { rejectMovement } from '../api'
import useEscapeKey from '../hooks/useEscapeKey'

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))
}

const CONCEPT_ICONS = {
  combustible: 'local_gas_station',
  diesel: 'local_gas_station',
  caseta: 'toll',
  peaje: 'toll',
  viatico: 'restaurant',
  alimento: 'restaurant',
  comida: 'restaurant',
  hospedaje: 'hotel',
  hotel: 'hotel',
  mantenimiento: 'build',
  reparacion: 'build',
}

function getConceptIcon(concept) {
  const lower = (concept || '').toLowerCase()
  for (const [key, icon] of Object.entries(CONCEPT_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return 'receipt_long'
}

export default function RejectMovementModal({ open, movement, tripId, onClose, onRejected }) {
  const [reason, setReason] = useState('')
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEscapeKey(onClose, open)

  if (!open || !movement) return null

  async function handleConfirm() {
    if (!reason.trim()) {
      setError('El motivo de rechazo es obligatorio')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const updated = await rejectMovement(tripId, movement.id, {
        rejection_reason: reason.trim(),
        notify_whatsapp: notifyWhatsApp,
      })
      onRejected(updated)
      setReason('')
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    if (submitting) return
    setReason('')
    setError('')
    onClose()
  }

  const icon = getConceptIcon(movement.concept)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white w-full max-w-md rounded-xl shadow-dropdown flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-300/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error-light flex items-center justify-center">
              <span className="material-icons text-error-main">block</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Rechazar Gasto</h2>
          </div>
          <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Expense summary */}
          <div className="bg-neutral-100 rounded p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary-subtle text-primary-main flex items-center justify-center">
                  <span className="material-icons">{icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{movement.concept}</p>
                  <p className="text-xs text-neutral-500">{movement.currency}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-neutral-900 tabular-nums">{formatMoney(movement.amount)}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Mensaje para el chofer
            </label>
            <textarea
              className="w-full rounded border border-neutral-300 bg-white text-sm text-neutral-900 p-3 placeholder:text-neutral-500 focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
              placeholder="Ej: Juan, el ticket de diesel no se lee, mandalo otra vez por favor..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* WhatsApp toggle */}
          <div className="flex items-center justify-between p-4 bg-primary-subtle rounded">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-sm font-medium text-neutral-700">Enviar por WhatsApp</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notifyWhatsApp}
                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                disabled={submitting}
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-main" />
            </label>
          </div>

          {error && (
            <div className="p-3 bg-error-light text-error-main rounded text-sm font-medium">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-100 flex gap-3 border-t border-neutral-300/50 rounded-b-xl">
          <button onClick={handleClose} disabled={submitting} className="btn btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || !reason.trim()}
            className="btn btn-danger flex-[1.5] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="material-icons animate-spin text-lg">progress_activity</span>
                Enviando...
              </>
            ) : (
              'Rechazar y Enviar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
