import { useState, useEffect } from 'react'
import { api } from '../api'

const ROLE_STYLES = {
  admin: { label: 'Admin', bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-700/10' },
  accountant: { label: 'Contador', bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-700/10' },
  driver: { label: 'Chofer', bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-700/10' },
}

function roleBadge(role) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.accountant
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
      {s.label}
    </span>
  )
}

function statusText(member) {
  if (member.has_password) return 'Activo'
  return 'Pendiente'
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    api('/api/companies/current/members')
      .then((data) => setMembers(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(created) {
    setMembers((m) => [...m, { ...created, has_password: false }])
    setModalOpen(false)
    if (created.invite_link) {
      window.prompt('Enlace de invitacion (copialo y envialo por correo):', created.invite_link)
    }
  }

  function handleUpdated(updated) {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    setEditTarget(null)
  }

  function handleDeleted(id) {
    setMembers((prev) => prev.filter((m) => m.id !== id))
    setDeleteTarget(null)
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Gestion de Usuarios y Roles</h1>
          <p className="mt-1 text-slate-500">Administra los accesos, permisos y perfiles del personal administrativo y operativo.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-teal-accent/25 transition-all hover:bg-brand-teal-accent/90"
        >
          <span className="material-symbols-outlined">person_add</span>
          Nuevo Miembro
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Usuario</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Rol</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">Cargando...</td>
                </tr>
              )}
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Aun no hay miembros. Usa el boton de arriba para invitar.
                  </td>
                </tr>
              )}
              {!loading && members.map((m) => {
                const email = m.email ?? m.user?.email ?? ''
                const name = m.name ?? email.split('@')[0]
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold shrink-0">
                          {getInitials(name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{name}</div>
                          <div className="text-xs text-slate-500">{email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {roleBadge(m.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${m.has_password ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {statusText(m)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditTarget(m)}
                        className="text-brand-teal-accent hover:text-brand-teal-accent/80 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="text-red-600 hover:text-red-500"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && members.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <div className="text-sm text-slate-500">Mostrando {members.length} usuario{members.length !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {modalOpen && (
        <MemberFormModal
          onClose={() => setModalOpen(false)}
          onSaved={handleCreated}
        />
      )}

      {/* Edit Member Modal */}
      {editTarget && (
        <MemberFormModal
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteMemberModal
          member={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}

/** Shared modal for both Add and Edit */
function MemberFormModal({ member, onClose, onSaved }) {
  const isEdit = !!member
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [role, setRole] = useState(member?.role ?? '')
  const [whatsapp, setWhatsapp] = useState(() => {
    const wa = member?.whatsapp ?? ''
    return wa.startsWith('+52') ? wa.slice(3) : wa
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const isDriver = role === 'driver'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isEdit && (!email.trim() || !role)) return
    if (isDriver && !isEdit && !whatsapp.trim()) {
      setError('El numero de WhatsApp es obligatorio para choferes')
      return
    }
    setSending(true)
    setError('')
    try {
      if (isEdit) {
        const body = {}
        if (role && role !== member.role) body.role = role
        if (name.trim() && name.trim() !== member.name) body.name = name.trim()
        if (isDriver && whatsapp.trim()) body.whatsapp = '+52' + whatsapp.replace(/\s/g, '')
        const updated = await api(`/api/companies/current/members/${member.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        onSaved(updated)
      } else {
        const body = {
          email: email.trim(),
          role,
          ...(name.trim() && { name: name.trim() }),
          ...(isDriver && whatsapp.trim() && { whatsapp: '+52' + whatsapp.replace(/\s/g, '') }),
        }
        const created = await api('/api/companies/current/members', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        onSaved(created)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-900">
            {isEdit ? 'Editar Miembro' : 'Agregar Nuevo Miembro'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <form id="member-form" className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-teal-accent focus:ring-brand-teal-accent"
                placeholder="ej. Maria Garcia"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Correo Electronico</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-sm">mail</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!isEdit}
                  disabled={isEdit}
                  className={`w-full rounded-lg border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-brand-teal-accent focus:ring-brand-teal-accent ${isEdit ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="usuario@logiconta.mx"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full rounded-lg border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-teal-accent focus:ring-brand-teal-accent"
              >
                <option value="">Seleccionar...</option>
                <option value="accountant">Contador</option>
                <option value="driver">Operador/Chofer</option>
              </select>
            </div>

            {/* WhatsApp - shown only for drivers */}
            {isDriver && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Numero de WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    +52
                  </span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="block w-full flex-1 rounded-none rounded-r-lg border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-teal-accent focus:ring-brand-teal-accent"
                    placeholder="55 1234 5678"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Requerido para operadores de ruta.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            disabled={sending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="member-form"
            disabled={sending || (!isEdit && (!email.trim() || !role))}
            className="rounded-lg bg-brand-teal-accent px-6 py-2 text-sm font-bold text-white shadow-lg shadow-brand-teal-accent/20 hover:bg-brand-teal-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending
              ? 'Guardando...'
              : isEdit
                ? 'Guardar Cambios'
                : 'Guardar Miembro'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteMemberModal({ member, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const email = member.email ?? member.user?.email ?? ''
  const name = member.name ?? email.split('@')[0]

  async function handleConfirm() {
    setDeleting(true)
    setError('')
    try {
      await api(`/api/companies/current/members/${member.id}`, {
        method: 'DELETE',
      })
      onDeleted(member.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <span className="material-symbols-outlined text-red-600">warning</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Eliminar Miembro</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm text-slate-600">
            Estas a punto de eliminar al miembro <span className="font-bold text-slate-900">{name}</span> ({email}).
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Esta accion no se puede deshacer. El usuario perdera acceso al sistema inmediatamente.
          </p>

          {/* Member summary card */}
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-100 p-4">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold shrink-0">
              {getInitials(name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
              <div className="text-xs text-slate-500 truncate">{email}</div>
            </div>
            {roleBadge(member.role)}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Eliminando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">delete</span>
                Eliminar Miembro
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
