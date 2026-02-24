import { useState, useEffect } from 'react'
import { getTrips } from '../api'

export default function MapView() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrips()
      .then((data) => setTrips(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <h1 className="page-title">Mapa de viajes</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Aquí se mostrará el mapa (Leaflet + OpenStreetMap) con las rutas de cada viaje. Misma vista que en el listado, filtros aplicables.
      </p>
      {loading && <p>Cargando viajes para el mapa…</p>}
      {!loading && (
        <div className="card">
          <div className="card-body">
            <p style={{ color: 'var(--text-muted)' }}>
              {trips.length === 0
                ? 'No hay viajes para mostrar en el mapa.'
                : `${trips.length} viaje(s) cargados. Integración con Leaflet pendiente.`}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
