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
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Mapa de viajes</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Visualizacion de rutas con OpenStreetMap. Integracion pendiente.
      </p>
      <div className="bg-white rounded-xl shadow-card p-8">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-neutral-500">
            <span className="material-icons animate-spin text-xl mr-2">progress_activity</span>
            Cargando viajes para el mapa...
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-4">
              <span className="material-icons text-3xl text-neutral-500">map</span>
            </div>
            <p className="text-neutral-900 font-semibold mb-1">
              {trips.length === 0 ? 'Sin viajes' : `${trips.length} viaje(s) cargados`}
            </p>
            <p className="text-neutral-500 text-sm max-w-sm">
              La integracion con Leaflet / OpenStreetMap esta pendiente de implementacion.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
