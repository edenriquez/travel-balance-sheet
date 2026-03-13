import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TripDetail from './pages/TripDetail'
import Members from './pages/Members'
import SetPassword from './pages/SetPassword'
import MapView from './pages/MapView'
import LandingPage from './pages/LandingPage'
import { getUser, setAuth, clearAuth } from './auth'

function useAuth() {
  const [user, setUser] = useState(getUser())
  useEffect(() => {
    const onStorage = () => setUser(getUser())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const login = (token, userData) => {
    setAuth(token, userData)
    setUser(userData)
  }
  const logout = () => {
    clearAuth()
    setUser(null)
  }
  return { user, login, logout }
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<Login useAuth={useAuth} />} />
      <Route path="/establecer-contrasena" element={<SetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout useAuth={useAuth} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="viaje/:id" element={<TripDetail />} />
        <Route path="miembros" element={<Members />} />
        <Route path="mapa" element={<MapView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
