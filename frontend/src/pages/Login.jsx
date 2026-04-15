import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

export default function Login({ useAuth }) {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Error al iniciar sesion')
      }
      const data = await res.json()
      login(data.access_token, data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen font-sans text-neutral-900 antialiased">
      {/* Left: Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900/90 via-neutral-800/70 to-primary-main/30" />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-main/20 backdrop-blur-sm">
              <span className="material-icons text-primary-light text-2xl" style={{ transform: 'scaleX(-1)' }}>local_shipping</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold text-white tracking-tight">Fleet</span>
              <span className="text-lg font-extrabold text-white tracking-tight">Budget</span>
            </div>
          </div>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Control total en cada kilometro.
            </h1>
            <p className="text-white/60 text-lg">
              Simplificando el balance de viajes para el transporte de carga.
            </p>
          </div>
          <div className="text-white/40 text-sm">
            &copy; 2024 Fleet Budget. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-subtle">
              <span className="material-icons text-primary-main text-2xl" style={{ transform: 'scaleX(-1)' }}>local_shipping</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold text-neutral-900 tracking-tight">Fleet</span>
              <span className="text-lg font-extrabold text-neutral-900 tracking-tight">Budget</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Iniciar sesion</h2>
            <p className="text-neutral-500 text-sm">Ingresa tus credenciales para acceder al panel.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5" htmlFor="email">
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ejemplo@empresa.mx"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5" htmlFor="password">
                Contrasena
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white border border-neutral-300 rounded text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/20 transition-all"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-light text-error-main rounded text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-main text-white font-bold rounded shadow-primary hover:bg-primary-dark transition-all disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-300 text-center">
            <span className="text-xs text-neutral-500">
              Acceso exclusivo para personal administrativo
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
