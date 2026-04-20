import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'
import { getUser } from '../auth'

// Role-based creation rules:
// admin -> can create accountants and drivers
// accountant -> can create drivers only
// driver -> cannot create anyone
const CREATABLE_ROLES = {
  admin: [
    { value: 'accountant', label: 'Contador', icon: 'calculate', description: 'Acceso al dashboard, revision de gastos' },
    { value: 'driver', label: 'Chofer', icon: 'local_shipping', description: 'Interactua via WhatsApp, reporta gastos' },
  ],
  accountant: [
    { value: 'driver', label: 'Chofer', icon: 'local_shipping', description: 'Interactua via WhatsApp, reporta gastos' },
  ],
  driver: [],
}

const ROLE_STYLES = {
  admin: { label: 'Admin', bg: 'bg-primary-subtle', text: 'text-primary-main' },
  accountant: { label: 'Contador', bg: 'bg-info-light', text: 'text-info-main' },
  driver: { label: 'Chofer', bg: 'bg-warning-light', text: 'text-warning-dark' },
}

function roleBadge(role) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.accountant
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-[11px] font-bold ${s.bg} ${s.text}`}>
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

function MemberTable({ members, loading, emptyMessage, isAdmin, currentRole, showRoleBadge, onEdit, onDelete }) {
  const colCount = showRoleBadge ? 4 : 3
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-neutral-200">
              <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Usuario</th>
              {showRoleBadge && (
                <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Rol</th>
              )}
              <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-neutral-600 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={colCount} className="px-6 py-12 text-center text-neutral-500 text-sm">
                  <span className="material-icons animate-spin text-xl mr-2 align-middle">progress_activity</span>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && members.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-6 py-12 text-center text-neutral-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading && members.map((m) => {
              const email = m.email ?? m.user?.email ?? ''
              const name = m.name ?? email.split('@')[0]
              const canManage = isAdmin || (currentRole === 'accountant' && m.role === 'driver')
              return (
                <tr key={m.id} className="border-b border-neutral-200/60 hover:bg-neutral-200/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm font-bold shrink-0">
                        {getInitials(name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{name}</div>
                        <div className="text-xs text-neutral-500">{email}</div>
                      </div>
                    </div>
                  </td>
                  {showRoleBadge && (
                    <td className="px-6 py-4 whitespace-nowrap">{roleBadge(m.role)}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${m.has_password ? 'bg-success-main' : 'bg-warning-main'}`} />
                      <span className="text-sm text-neutral-600">{statusText(m)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {canManage && (
                      <>
                        <button
                          onClick={() => onEdit(m)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition-all mr-1"
                          title="Editar"
                        >
                          <span className="material-icons text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => onDelete(m)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded text-neutral-400 hover:bg-error-subtle hover:text-error-main transition-all"
                          title="Eliminar"
                        >
                          <span className="material-icons text-lg">delete</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!loading && members.length > 0 && (
        <div className="px-6 py-3 border-t border-neutral-200/60">
          <span className="text-xs text-neutral-500">{members.length} usuario{members.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

export default function Members() {
  const currentUser = getUser()
  const currentRole = currentUser?.role || 'driver'
  const canCreate = (CREATABLE_ROLES[currentRole] || []).length > 0
  const isAdmin = currentRole === 'admin'

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const staff = useMemo(() => members.filter((m) => m.role !== 'driver'), [members])
  const drivers = useMemo(() => members.filter((m) => m.role === 'driver'), [members])

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
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Equipo</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isAdmin
              ? 'Administra los accesos y permisos del personal.'
              : 'Gestiona los choferes de tu empresa.'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <span className="material-icons text-lg">person_add</span>
            {isAdmin ? 'Nuevo Miembro' : 'Nuevo Chofer'}
          </button>
        )}
      </div>

      {/* Staff section — admin only */}
      {isAdmin && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-icons text-[20px] text-neutral-500">badge</span>
            <h2 className="text-lg font-bold text-neutral-900">Personal Administrativo</h2>
            {!loading && <span className="text-xs text-neutral-500 bg-neutral-200 rounded-full px-2 py-0.5 font-medium">{staff.length}</span>}
          </div>
          <MemberTable
            members={staff}
            loading={loading}
            emptyMessage="No hay personal administrativo registrado."
            isAdmin={isAdmin}
            currentRole={currentRole}
            showRoleBadge={true}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </div>
      )}

      {/* Drivers section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="material-icons text-[20px] text-neutral-500">local_shipping</span>
          <h2 className="text-lg font-bold text-neutral-900">Choferes</h2>
          {!loading && <span className="text-xs text-neutral-500 bg-neutral-200 rounded-full px-2 py-0.5 font-medium">{drivers.length}</span>}
        </div>
        <MemberTable
          members={drivers}
          loading={loading}
          emptyMessage="Aun no hay choferes. Agrega uno para comenzar."
          isAdmin={isAdmin}
          currentRole={currentRole}
          showRoleBadge={false}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Modals */}
      {modalOpen && (
        <MemberFormModal
          currentRole={currentRole}
          onClose={() => setModalOpen(false)}
          onSaved={handleCreated}
        />
      )}
      {editTarget && <MemberFormModal currentRole={currentRole} member={editTarget} onClose={() => setEditTarget(null)} onSaved={handleUpdated} />}
      {deleteTarget && <DeleteMemberModal member={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
    </>
  )
}

function MemberFormModal({ member, currentRole, onClose, onSaved }) {
  const isEdit = !!member
  const allowedRoles = CREATABLE_ROLES[currentRole] || []
  const memberEmail = member?.email ?? member?.user?.email ?? ''
  const memberName = member?.name ?? (memberEmail ? memberEmail.split('@')[0] : '')
  const [name, setName] = useState(memberName)
  const [email, setEmail] = useState(memberEmail)
  const [role, setRole] = useState(() => {
    if (member?.role) return member.role
    if (allowedRoles.length === 1) return allowedRoles[0].value
    return allowedRoles[0]?.value || ''
  })
  const [whatsapp, setWhatsapp] = useState(() => {
    const wa = member?.whatsapp ?? member?.phone ?? ''
    return wa.startsWith('+52') ? wa.slice(3) : wa
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const isDriver = role === 'driver'
  const showTabs = !isEdit && allowedRoles.length > 1

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-dropdown overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-300/50 px-6 py-4">
          <h3 className="text-lg font-bold text-neutral-900">
            {isEdit ? 'Editar Miembro' : 'Nuevo Miembro'}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Role tabs */}
        {showTabs && (
          <div className="flex border-b border-neutral-300/50">
            {allowedRoles.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                  role === opt.value
                    ? 'text-primary-main'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="material-icons text-lg">{opt.icon}</span>
                {opt.label}
                {role === opt.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-main" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-6">
          <form id="member-form" className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                placeholder="ej. Maria Garcia"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Correo Electronico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isEdit}
                disabled={isEdit}
                className={`w-full rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20 ${isEdit ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed' : ''}`}
                placeholder="usuario@empresa.mx"
              />
            </div>

            {isDriver && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                  Numero de WhatsApp <span className="text-error-main">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l border border-r-0 border-neutral-300 bg-neutral-200 px-3 text-sm text-neutral-600">
                    +52
                  </span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="block w-full flex-1 rounded-none rounded-r border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-main focus:ring-2 focus:ring-primary-main/20"
                    placeholder="55 1234 5678"
                  />
                </div>
                <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1">
                  <span className="material-icons text-[14px]">info</span>
                  Requerido para vincular con el bot de WhatsApp.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-error-light text-error-main rounded text-sm font-medium">{error}</div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-300/50 bg-neutral-100 px-6 py-4">
          <button onClick={onClose} disabled={sending} className="btn btn-ghost">
            Cancelar
          </button>
          <button
            type="submit"
            form="member-form"
            disabled={sending || (!isEdit && (!email.trim() || !role))}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : `Guardar ${allowedRoles.find(r => r.value === role)?.label || 'Miembro'}`}
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
      await api(`/api/companies/current/members/${member.id}`, { method: 'DELETE' })
      onDeleted(member.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-dropdown overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-300/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error-light flex items-center justify-center">
              <span className="material-icons text-error-main">warning</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Eliminar Miembro</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-sm text-neutral-600">
            Estas a punto de eliminar al miembro <span className="font-bold text-neutral-900">{name}</span>.
          </p>
          <p className="text-sm text-neutral-600 mt-2">
            Esta accion no se puede deshacer.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded bg-neutral-100 border border-neutral-300/50 p-4">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm font-bold shrink-0">
              {getInitials(name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-900 truncate">{name}</div>
              <div className="text-xs text-neutral-500 truncate">{email}</div>
            </div>
            {roleBadge(member.role)}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-error-light text-error-main rounded text-sm font-medium">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-300/50 bg-neutral-100 px-6 py-4">
          <button onClick={onClose} disabled={deleting} className="btn btn-ghost">Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="btn btn-danger flex items-center gap-2 disabled:opacity-50"
          >
            {deleting ? (
              <>
                <span className="material-icons animate-spin text-lg">progress_activity</span>
                Eliminando...
              </>
            ) : (
              <>
                <span className="material-icons text-lg">delete</span>
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
