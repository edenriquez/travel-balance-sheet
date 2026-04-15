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

export async function approveMovement(tripId, movementId) {
  return api(`/api/trips/${tripId}/movements/${movementId}/approve`, {
    method: 'PATCH',
  })
}

export async function rejectMovement(tripId, movementId, { rejection_reason, notify_whatsapp }) {
  return api(`/api/trips/${tripId}/movements/${movementId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejection_reason, notify_whatsapp }),
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
