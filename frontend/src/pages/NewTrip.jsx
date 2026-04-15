import { useEffect, useMemo, useState } from 'react'
import { api, getDrivers } from '../api'

export default function NewTripModal({ open, onClose, onCreated }) {
  const [drivers, setDrivers] = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const emptyForm = {
    load_date: '',
    load_time: '',
    folio: '',
    origin_name: '',
    load_company: '',
    destination_name: '',
    delivery_client: '',
    unit_type: '',
    driver_id: '',
    truck: '',
    trailer: '',
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingDrivers(true)
    getDrivers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items ?? []
        if (!cancelled) setDrivers(list)
        if (!cancelled && list.length > 0) {
          setForm((f) => ({ ...f, driver_id: f.driver_id || list[0].id }))
        }
      })
      .catch(() => { if (!cancelled) setDrivers([]) })
      .finally(() => { if (!cancelled) setLoadingDrivers(false) })
    return () => { cancelled = true }
  }, [open])

  const canSubmit = useMemo(() => {
    return (
      form.load_date &&
      form.load_time &&
      form.folio.trim() &&
      form.origin_name.trim() &&
      form.load_company.trim() &&
      form.destination_name.trim() &&
      form.delivery_client.trim() &&
      form.unit_type.trim() &&
      form.driver_id &&
      form.truck.trim() &&
      form.trailer.trim()
    )
  }, [form])

  const onChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const handleClose = () => {
    setForm(emptyForm)
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setSaving(true)
    try {
      await api('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          folio: form.folio.trim(),
          origin_name: form.origin_name.trim(),
          load_company: form.load_company.trim(),
          destination_name: form.destination_name.trim(),
          delivery_client: form.delivery_client.trim(),
          unit_type: form.unit_type.trim(),
          truck: form.truck.trim(),
          trailer: form.trailer.trim(),
        }),
      })
      setForm(emptyForm)
      setError('')
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo crear el viaje')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-xl shadow-dropdown w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-300/50">
          <h2 className="text-lg font-bold text-neutral-900">Nuevo viaje</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-neutral-200 transition-colors text-neutral-400 hover:text-neutral-600"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="form-group !mb-0">
                <label>Fecha de carga</label>
                <input type="date" value={form.load_date} onChange={onChange('load_date')} required />
              </div>
              <div className="form-group !mb-0">
                <label>Hora de carga</label>
                <input type="time" value={form.load_time} onChange={onChange('load_time')} required />
              </div>
              <div className="form-group !mb-0">
                <label>Folio</label>
                <input value={form.folio} onChange={onChange('folio')} placeholder="Ej. FOL-123" required />
              </div>
            </div>

            <div className="form-group">
              <label>Origen</label>
              <input value={form.origin_name} onChange={onChange('origin_name')} placeholder="Ciudad / direccion" required />
            </div>

            <div className="form-group">
              <label>Empresa</label>
              <input value={form.load_company} onChange={onChange('load_company')} placeholder="Empresa que carga" required />
            </div>

            <div className="form-group">
              <label>Destino</label>
              <input value={form.destination_name} onChange={onChange('destination_name')} placeholder="Ciudad / direccion" required />
            </div>

            <div className="form-group">
              <label>Cliente de entrega</label>
              <input value={form.delivery_client} onChange={onChange('delivery_client')} placeholder="Cliente" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="form-group !mb-0">
                <label>Tipo de unidad</label>
                <input value={form.unit_type} onChange={onChange('unit_type')} placeholder="Ej. Tractocamion" required />
              </div>
              <div className="form-group !mb-0">
                <label>Operador</label>
                <select value={form.driver_id} onChange={onChange('driver_id')} disabled={loadingDrivers} required>
                  {drivers.length === 0 && <option value="">Sin operadores</option>}
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="form-group !mb-0">
                <label>Carro</label>
                <input value={form.truck} onChange={onChange('truck')} placeholder="Identificador del carro" required />
              </div>
              <div className="form-group !mb-0">
                <label>Caja</label>
                <input value={form.trailer} onChange={onChange('trailer')} placeholder="Identificador de la caja" required />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-light text-error-main rounded text-sm font-medium mt-2">{error}</div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-300/50">
              <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
              <button className="btn btn-primary" type="submit" disabled={!canSubmit || saving}>
                {saving ? 'Guardando...' : 'Crear viaje'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
