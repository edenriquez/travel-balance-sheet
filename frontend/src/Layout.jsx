import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function Layout({ useAuth }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/mapa', icon: 'map', label: 'Viajes' },
    { to: '/miembros', icon: 'people', label: 'Conductores', adminOnly: true },
    { to: '#', icon: 'account_balance_wallet', label: 'Finanzas' },
    { to: '#', icon: 'settings', label: 'Configuración' },
  ]

  return (
    <>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 z-50">
        <div className="mb-10 text-primary">
          <span className="material-icons text-4xl">local_shipping</span>
        </div>
        <nav className="flex flex-col gap-8">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'admin')
            .map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `p-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-400 hover:text-primary'
                  }`
                }
              >
                <span className="material-icons">{item.icon}</span>
              </NavLink>
            ))}
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <span className="material-icons">logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-20 p-8 min-h-screen bg-background-light font-display">
        <Outlet />
      </main>
    </>
  )
}
