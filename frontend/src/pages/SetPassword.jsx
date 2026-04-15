import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) setError('Falta el enlace de invitacion. Revisa el correo que te enviaron.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contrasenas no coinciden')
      return
    }
    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api('/api/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-subtle">
            <span className="material-icons text-primary-main text-2xl" style={{ transform: 'scaleX(-1)' }}>local_shipping</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold text-neutral-900 tracking-tight">Fleet</span>
            <span className="text-lg font-extrabold text-neutral-900 tracking-tight">Budget</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Establecer contrasena</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Crea una contrasena para tu cuenta. Luego podras iniciar sesion con tu correo y esta contrasena.
          </p>

          {success ? (
            <div className="p-4 bg-success-light text-success-main rounded text-sm font-medium flex items-center gap-2">
              <span className="material-icons text-lg">check_circle</span>
              Contrasena guardada. Redirigiendo al inicio de sesion...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5" htmlFor="password">
                  Nueva contrasena
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={!token}
                  className="w-full px-4 py-3 border border-neutral-300 rounded text-sm bg-white focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5" htmlFor="confirm">
                  Confirmar contrasena
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={!token}
                  className="w-full px-4 py-3 border border-neutral-300 rounded text-sm bg-white focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                />
              </div>

              {error && (
                <div className="p-3 bg-error-light text-error-main rounded text-sm font-medium">{error}</div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full py-3"
                disabled={!token || loading}
              >
                {loading ? 'Guardando...' : 'Guardar contrasena'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
