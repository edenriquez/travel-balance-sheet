import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import NotificationBell from './components/NotificationBell'

export default function Layout({ useAuth }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navSections = [
    {
      label: 'General',
      items: [
        { to: '/', icon: 'space_dashboard', label: 'Viajes', end: true },
      ],
    },
    {
      label: 'Administracion',
      items: [
        { to: '/miembros', icon: 'group', label: 'Equipo', adminOnly: true },
      ],
    },
  ]

  const sidebarW = collapsed ? 'w-[88px]' : 'w-[280px]'
  const mainML = collapsed ? 'ml-[88px]' : 'ml-[280px]'

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${sidebarW} bg-sidebar flex flex-col z-50 transition-all duration-200`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-6 h-[80px] shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-main/20">
            <span className="material-icons text-primary-light text-2xl" style={{ transform: 'scaleX(-1)' }}>local_shipping</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold text-white tracking-tight">Fleet</span>
              <span className="text-[15px] font-extrabold text-white tracking-tight">Budget</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || user?.role === 'admin'
            )
            if (visibleItems.length === 0) return null
            return (
              <div key={section.label} className="mb-4">
                {!collapsed && (
                  <p className="px-4 mb-2 text-[11px] font-bold uppercase tracking-[1.1px] text-neutral-500">
                    {section.label}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg transition-all duration-150 ${
                          collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5'
                        } ${
                          isActive
                            ? 'bg-sidebar-active text-primary-light font-bold'
                            : 'text-neutral-500 hover:bg-sidebar-hover hover:text-neutral-400'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 w-[3px] h-6 bg-primary-main rounded-r" />
                          )}
                          <span className="material-icons text-[20px]">{item.icon}</span>
                          {!collapsed && (
                            <span className="text-sm">{item.label}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-4 border-t border-white/[0.08]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-neutral-500 hover:bg-sidebar-hover hover:text-neutral-400 transition-all ${collapsed ? 'justify-center px-3' : ''}`}
          >
            <span className="material-icons text-[20px]">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!collapsed && <span className="text-sm">Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`${mainML} min-h-screen bg-neutral-100 transition-all duration-200`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-300/50 flex items-center justify-end gap-3 px-8">
          <NotificationBell />

          {/* User avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-neutral-300/50">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-neutral-900 leading-tight">
                {user?.name || user?.email?.split('@')[0] || 'Usuario'}
              </span>
              <span className="text-[11px] text-neutral-500 capitalize">{user?.role || 'admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesion"
              className="w-10 h-10 rounded-full bg-primary-subtle text-primary-main flex items-center justify-center text-sm font-bold hover:bg-primary-main hover:text-white transition-all"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8 font-sans">
          <Outlet />
        </main>
      </div>
    </>
  )
}
