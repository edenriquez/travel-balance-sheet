import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white text-neutral-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-neutral-300/50 px-6 lg:px-20 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-subtle">
              <span className="material-icons text-primary-main text-2xl" style={{ transform: 'scaleX(-1)' }}>local_shipping</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold text-neutral-900 tracking-tight">Fleet</span>
              <span className="text-[15px] font-extrabold text-neutral-900 tracking-tight">Budget</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-semibold text-neutral-600 hover:text-primary-main transition-colors" href="#caracteristicas">Herramientas</a>
            <a className="text-sm font-semibold text-neutral-600 hover:text-primary-main transition-colors" href="#testimonio">Testimonios</a>
          </nav>
          <Link
            to="/login"
            className="btn btn-primary"
          >
            Iniciar Sesion
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative px-6 py-12 lg:px-20 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-xl bg-neutral-800 min-h-[550px] flex items-center shadow-card">
              <div className="absolute inset-0 opacity-50">
                <img
                  alt="Trailer en carretera"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpymQ6XHlmnpS_9dZtkrkNrVvj7nWGm1hlGbTKrBeVBnLbnJNIfS5BifdbKSwJZyKeb5s8Jd6nSfAUDA9p2RS9T3tdP1Hk1n5iSimRTvBVRmHVOonm5EBOZTD0W1pjxLeJOzzY5DcXtYMV2BXqu_lYMFOEa5vAn9nDjcdVlZo84_uTDOsExkd8WPRslenOcfVgOLpYWJkVCqOlCUhBol_rThIWO2RaCfIaJUeX1foLBU2zLt2lrDbOS8NyOinSaR1TmUROlvX_lww"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent" />
              </div>
              <div className="relative z-10 flex flex-col items-start gap-6 px-8 py-16 lg:px-16 max-w-2xl">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-main/20 backdrop-blur-sm rounded text-primary-light text-xs font-bold uppercase tracking-wider">
                  WhatsApp + Dashboard
                </span>
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  Control de gastos que tus <span className="text-primary-light">choferes</span> si usan
                </h1>
                <p className="text-lg text-white/60 max-w-lg">
                  Tus operadores reportan gastos por WhatsApp. Tu revisas y apruebas desde el dashboard. Sin apps, sin capacitacion, sin friccion.
                </p>
                <div className="flex gap-4 mt-2">
                  <button className="btn btn-primary text-base px-8 py-3 h-auto">
                    Solicitar Demo
                  </button>
                  <button className="px-8 py-3 rounded border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 transition-all">
                    Ver Funcionamiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 lg:px-20 bg-neutral-100" id="caracteristicas">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-xl">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Hecho para el transporte mexicano
              </h2>
              <p className="text-neutral-500">
                Herramientas que entienden como trabajan las flotillas reales. Menos papeleo, mas control.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: 'chat',
                  title: 'WhatsApp como interfaz',
                  desc: 'Tus choferes ya saben usar WhatsApp. Solo mandan un mensaje con el gasto y la foto del ticket. Sin apps nuevas.',
                },
                {
                  icon: 'receipt_long',
                  title: 'Aprobacion de gastos',
                  desc: 'Revisa cada ticket, aprueba o rechaza con un mensaje personalizado que le llega al chofer por WhatsApp.',
                },
                {
                  icon: 'insights',
                  title: 'Visibilidad total',
                  desc: 'Filtra viajes por chofer, cliente, ruta o periodo. Sabe exactamente cuanto gastas y en que, sin esperar a la junta del viernes.',
                },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-xl shadow-card p-8 hover:shadow-dropdown transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary-subtle flex items-center justify-center mb-5">
                    <span className="material-icons text-primary-main text-2xl">{f.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">{f.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="px-6 py-20 lg:px-20 bg-neutral-800" id="testimonio">
          <div className="mx-auto max-w-4xl text-center">
            <blockquote>
              <p className="text-2xl lg:text-3xl font-medium text-white leading-relaxed mb-8">
                &ldquo;Antes perdiamos dias cuadrando los fletes de la semana. Con Fleet Budget, mis operadores me mandan todo por WhatsApp y las liquidaciones estan listas el mismo viernes.&rdquo;
              </p>
              <cite className="not-italic">
                <span className="block text-primary-light font-bold text-lg">Ricardo Mendez</span>
                <span className="text-white/40 text-sm">Transportes El Aguila</span>
              </cite>
            </blockquote>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 lg:px-20 bg-white">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Listo para tomar el control?
            </h2>
            <p className="text-neutral-500 mb-8 max-w-lg mx-auto">
              Unete a las empresas transportistas que ya dejaron el Excel y las juntas de cuadre.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="btn btn-primary text-base px-10 py-3 h-auto">
                Solicitar Demo
              </button>
              <button className="btn btn-ghost text-base px-10 py-3 h-auto border border-neutral-300">
                Hablar con un Experto
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-300/50 bg-neutral-100 px-6 py-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-primary-subtle">
                  <span className="material-icons text-primary-main text-lg" style={{ transform: 'scaleX(-1)' }}>local_shipping</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-extrabold text-neutral-900 tracking-tight">Fleet</span>
                  <span className="text-sm font-extrabold text-neutral-900 tracking-tight">Budget</span>
                </div>
              </div>
              <p className="text-sm text-neutral-500 max-w-sm">
                Control de gastos de flotilla para el transporte de carga en Mexico.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-3">Producto</h4>
                <ul className="space-y-2 text-sm text-neutral-500">
                  <li><a className="hover:text-primary-main transition-colors" href="#">Liquidaciones</a></li>
                  <li><a className="hover:text-primary-main transition-colors" href="#">Control de Diesel</a></li>
                  <li><a className="hover:text-primary-main transition-colors" href="#">Reportes</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[1px] text-neutral-600 mb-3">Soporte</h4>
                <ul className="space-y-2 text-sm text-neutral-500">
                  <li><a className="hover:text-primary-main transition-colors" href="#">Centro de Ayuda</a></li>
                  <li><a className="hover:text-primary-main transition-colors" href="#">Contacto</a></li>
                  <li><a className="hover:text-primary-main transition-colors" href="#">Privacidad</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-neutral-300/50 text-center text-xs text-neutral-500">
            &copy; 2024 Fleet Budget. Hecho para el camino.
          </div>
        </div>
      </footer>
    </div>
  )
}
