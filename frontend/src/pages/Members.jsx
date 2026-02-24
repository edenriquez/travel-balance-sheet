import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('accountant')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api('/api/companies/current/members')
      .then((data) => setMembers(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setSending(true)
    setError('')
    try {
      const created = await api('/api/companies/current/members', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      setMembers((m) => [...m, { ...created, has_password: false }])
      setInviteEmail('')
      if (created.invite_link) {
        window.prompt('Enlace de invitación (cópialo y envíalo por correo):', created.invite_link)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Gestión de miembros</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Solo los administradores pueden invitar contadores o conductores. El nuevo miembro recibirá un enlace para establecer su contraseña.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <h2 style={{ marginTop: 0, fontSize: '1.125rem' }}>Invitar miembro</h2>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label htmlFor="invite-email">Correo</label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nuevo@empresa.com"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '140px' }}>
              <label htmlFor="invite-role">Rol</label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="accountant">Contador</option>
                <option value="driver">Conductor</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Enviando…' : 'Invitar'}
            </button>
          </form>
          {error && <p style={{ color: 'var(--error)', marginTop: '0.75rem', marginBottom: 0, fontSize: '0.875rem' }}>{error}</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 style={{ marginTop: 0, fontSize: '1.125rem' }}>Miembros de la empresa</h2>
          {loading && <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>}
          {!loading && members.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>Aún no hay miembros. Usa el formulario de arriba para invitar.</p>
          )}
          {!loading && members.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {members.map((m) => (
                <li
                  key={m.id}
                  style={{
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span>{m.email ?? m.user?.email}</span>
                  <span className="badge badge-in-progress">{m.role}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {m.has_password ? 'Activo' : 'Pendiente de contraseña'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
