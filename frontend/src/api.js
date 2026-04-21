/**
 * Cliente API hacia el backend FastAPI.
 * Incluye token de auth cuando existe; en 401 limpia auth y lanza.
 */
import { getToken, clearAuth } from './auth'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  return ''
}

export async function api(path, options = {}) {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    clearAuth()
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Sesión expirada')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || res.statusText || `Error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function getTrips(params = {}) {
  const q = new URLSearchParams(params).toString()
  return api(`/api/trips${q ? `?${q}` : ''}`)
}

export async function getTrip(id) {
  return api(`/api/trips/${id}`)
}

export async function getDrivers() {
  return api('/api/drivers')
}

export async function approveMovement(tripId, movementId, overrides = null) {
  const opts = { method: 'PATCH' }
  if (overrides && (overrides.concept !== undefined || overrides.amount !== undefined)) {
    const body = {}
    if (overrides.concept !== undefined) body.concept = overrides.concept
    if (overrides.amount !== undefined) body.amount = overrides.amount
    opts.body = JSON.stringify(body)
  }
  return api(`/api/trips/${tripId}/movements/${movementId}/approve`, opts)
}

export async function rejectMovement(tripId, movementId, { rejection_reason, notify_whatsapp }) {
  return api(`/api/trips/${tripId}/movements/${movementId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejection_reason, notify_whatsapp }),
  })
}

export async function addMovement(tripId, { type = 'expense', concept, amount, currency = 'MXN', movement_date, evidence }) {
  const form = new FormData()
  form.append('type', type)
  form.append('concept', concept)
  form.append('amount', String(amount))
  form.append('currency', currency)
  form.append('movement_date', movement_date)
  if (evidence) form.append('evidence', evidence)

  const url = `${getBaseUrl()}/api/trips/${tripId}/movements`
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers, body: form })
  if (res.status === 401) {
    clearAuth()
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Sesión expirada')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || res.statusText || `Error ${res.status}`)
  }
  return res.json()
}

export async function closeTrip(tripId, { notes } = {}) {
  const body = { status: 'closed' }
  if (notes?.trim()) body.notes = notes.trim()
  return api(`/api/trips/${tripId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function health() {
  return api('/health')
}

/** @param {{ unacknowledged_only?: boolean }} [params] */
export async function getNotifications(params = {}) {
  const q = new URLSearchParams()
  if (params.unacknowledged_only) q.set('unacknowledged_only', 'true')
  const qs = q.toString()
  return api(`/api/notifications${qs ? `?${qs}` : ''}`)
}

export async function acknowledgeNotification(notificationId) {
  return api(`/api/notifications/${notificationId}`, {
    method: 'PUT',
    body: JSON.stringify({ acknowledged: true }),
  })
}
