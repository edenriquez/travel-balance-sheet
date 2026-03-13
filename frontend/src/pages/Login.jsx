import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

export default function Login({ useAuth }) {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
    <div className="flex min-h-screen bg-brand-cream font-display text-slate-900 antialiased">
      {/* Left Side: Visual Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-teal-dark/10">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-80"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-teal-dark/90 to-brand-teal-accent/40" />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-3 text-white">
            <div className="truck-icon-wrapper !bg-white/20 !border-white/10 backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-2xl -scale-x-100">local_shipping</span>
            </div>
            <div className="flex flex-col leading-[0.9]">
              <span className="text-xl font-black tracking-tight text-white uppercase">Fleet</span>
              <span className="text-xl font-black tracking-tight text-white uppercase">Budget</span>
            </div>
          </div>
          <div className="max-w-md">
            <h1 className="text-5xl font-black text-white leading-tight mb-6">
              Control total en cada kilometro.
            </h1>
            <p className="text-white/80 text-lg font-medium">
              Simplificando el balance de viajes para el transporte de carga de manera eficiente y segura.
            </p>
          </div>
          <div className="text-white/60 text-sm">
            &copy; 2024 LogiConta Mexico. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-brand-cream">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <div className="truck-icon-wrapper">
              <span className="material-symbols-outlined text-brand-teal-accent text-2xl -scale-x-100">local_shipping</span>
            </div>
            <div className="flex flex-col leading-[0.9]">
              <span className="text-lg font-black tracking-tight text-brand-teal-dark uppercase">Fleet</span>
              <span className="text-lg font-black tracking-tight text-brand-teal-dark uppercase">Budget</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Bienvenido</h2>
            <p className="text-slate-500">Ingrese sus credenciales para acceder al panel administrativo.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="email">
                Correo Electronico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-teal-accent transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="ejemplo@logiconta.mx"
                  className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal-accent/20 focus:border-brand-teal-accent outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="password">
                Contrasena
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-teal-accent transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-12 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal-accent/20 focus:border-brand-teal-accent outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none size-5 border border-slate-300 rounded bg-white checked:bg-brand-teal-accent checked:border-brand-teal-accent transition-all"
                  />
                  <span className="material-symbols-outlined absolute text-white text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none">
                    check
                  </span>
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  Recordarme
                </span>
              </label>
              <a className="text-sm font-semibold text-brand-teal-accent hover:text-brand-teal-accent/80 transition-colors" href="#">
                Olvido su contrasena?
              </a>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-teal-accent hover:bg-brand-teal-accent/90 text-white font-bold rounded-xl shadow-lg shadow-brand-teal-accent/20 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-medium text-slate-500">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Acceso exclusivo para personal administrativo
            </div>
          </div>

          <div className="mt-12 flex justify-center gap-6">
            <a className="text-xs text-slate-400 hover:text-slate-600 transition-colors" href="#">
              Aviso de Privacidad
            </a>
            <a className="text-xs text-slate-400 hover:text-slate-600 transition-colors" href="#">
              Soporte Tecnico
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
