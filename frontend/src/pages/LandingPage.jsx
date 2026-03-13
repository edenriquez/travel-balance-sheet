import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-brand-cream dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-brand-teal-dark/10 dark:border-slate-800 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-6 lg:px-20 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="truck-logo-container">
              <div className="truck-icon-wrapper">
                <span className="material-symbols-outlined text-3xl text-brand-teal-accent -scale-x-100">local_shipping</span>
              </div>
              <div className="flex flex-col leading-[0.9]">
                <span className="text-xl font-black tracking-tight text-brand-teal-dark uppercase">Fleet</span>
                <span className="text-xl font-black tracking-tight text-brand-teal-dark uppercase">Budget</span>
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-xs font-bold uppercase tracking-widest text-brand-teal-dark/70 hover:text-brand-teal-accent transition-colors" href="#caracteristicas">Herramientas</a>
            <a className="text-xs font-bold uppercase tracking-widest text-brand-teal-dark/70 hover:text-brand-teal-accent transition-colors" href="#fletes">Fletes</a>
            <a className="text-xs font-bold uppercase tracking-widest text-brand-teal-dark/70 hover:text-brand-teal-accent transition-colors" href="#testimonio">Testimonios</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="flex h-11 items-center justify-center rounded border-2 border-brand-teal-dark bg-brand-teal-dark px-6 text-sm font-black uppercase tracking-wider text-white hover:bg-transparent hover:text-brand-teal-dark transition-all"
            >
              Iniciar Sesion
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative px-6 py-8 lg:px-20 lg:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded shadow-2xl bg-brand-teal-dark min-h-[650px] flex items-center">
              <div className="absolute inset-0 opacity-60">
                <img
                  alt="Trailer en carretera mexicana"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpymQ6XHlmnpS_9dZtkrkNrVvj7nWGm1hlGbTKrBeVBnLbnJNIfS5BifdbKSwJZyKeb5s8Jd6nSfAUDA9p2RS9T3tdP1Hk1n5iSimRTvBVRmHVOonm5EBOZTD0W1pjxLeJOzzY5DcXtYMV2BXqu_lYMFOEa5vAn9nDjcdVlZo84_uTDOsExkd8WPRslenOcfVgOLpYWJkVCqOlCUhBol_rThIWO2RaCfIaJUeX1foLBU2zLt2lrDbOS8NyOinSaR1TmUROlvX_lww"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-teal-dark via-brand-teal-dark/70 to-transparent"></div>
              </div>
              <div className="relative z-10 flex flex-col items-start justify-center gap-6 px-8 py-20 lg:px-16 max-w-3xl">
                <div className="flex items-center gap-3 mb-4 bg-brand-cream/10 backdrop-blur-sm p-4 rounded border border-white/10">
                  <div className="p-2 bg-brand-cream rounded">
                    <span className="material-symbols-outlined text-4xl text-brand-teal-accent">local_shipping</span>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-2xl font-black text-brand-cream uppercase">Fleet</span>
                    <span className="text-2xl font-black text-brand-cream uppercase">Budget</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 border-l-4 border-brand-teal-accent bg-brand-teal-accent/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-teal-accent">
                  Equipo Pesado &bull; Operadores &bull; Logistica
                </div>
                <h1 className="text-5xl font-black leading-[1] text-white lg:text-7xl uppercase italic tracking-tighter">
                  La App que los <span className="text-brand-teal-accent">Choferes</span> de Mexico Si Usan
                </h1>
                <p className="text-lg text-slate-300 lg:text-xl font-medium max-w-2xl border-l border-white/20 pl-6">
                  Simplifica la liquidacion de fletes, control de diesel y reportes de viaje. Diseñada por y para el camino con la nueva identidad de Fleet Budget.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                  <button className="flex h-16 items-center justify-center rounded bg-brand-teal-accent px-10 text-base font-black uppercase tracking-widest text-white shadow-xl hover:bg-white hover:text-brand-teal-accent transition-all">
                    Solicitar Demo
                  </button>
                  <button className="flex h-16 items-center justify-center rounded border-2 border-white bg-transparent px-10 text-base font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                    Ver Funcionamiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 lg:px-20 bg-brand-cream-dark dark:bg-slate-900" id="caracteristicas">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 border-b border-brand-teal-dark/10 dark:border-slate-800 pb-8">
              <h2 className="mb-4 text-4xl font-black tracking-tighter text-brand-teal-dark dark:text-white uppercase italic">
                Control de <span className="text-brand-teal-accent">Operaciones</span> en Ruta
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-bold max-w-3xl uppercase tracking-wider">
                Herramientas robustas para un trabajo exigente. Menos papeleo, mas tiempo en el volante.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="group relative flex flex-col gap-6 border-b-4 border-brand-teal-dark bg-white dark:bg-slate-800 p-8 hover:shadow-2xl transition-all">
                <div className="flex h-16 w-16 items-center justify-center bg-brand-cream dark:bg-slate-700 text-brand-teal-accent border border-brand-teal-dark/5">
                  <span className="material-symbols-outlined text-4xl">steering_wheel_heat</span>
                </div>
                <div>
                  <h3 className="mb-3 text-xl font-black text-brand-teal-dark dark:text-white uppercase tracking-tight italic">Hecho para el Camino</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Interfaz simplificada para operadores. Registra tus fletes y paradas con solo un par de toques, sin distracciones innecesarias.
                  </p>
                </div>
              </div>
              <div className="group relative flex flex-col gap-6 border-b-4 border-brand-teal-accent bg-white dark:bg-slate-800 p-8 hover:shadow-2xl transition-all">
                <div className="flex h-16 w-16 items-center justify-center bg-brand-cream dark:bg-slate-700 text-brand-teal-accent border border-brand-teal-dark/5">
                  <span className="material-symbols-outlined text-4xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="mb-3 text-xl font-black text-brand-teal-dark dark:text-white uppercase tracking-tight italic">Reportes sin Complicaciones</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Reportes instantaneos. Envia fotos de casetas y comprobantes de gastos. El sistema de Fleet Budget lo procesa en automatico.
                  </p>
                </div>
              </div>
              <div className="group relative flex flex-col gap-6 border-b-4 border-brand-teal-dark bg-white dark:bg-slate-800 p-8 hover:shadow-2xl transition-all">
                <div className="flex h-16 w-16 items-center justify-center bg-brand-cream dark:bg-slate-700 text-brand-teal-accent border border-brand-teal-dark/5">
                  <span className="material-symbols-outlined text-4xl">local_gas_station</span>
                </div>
                <div>
                  <h3 className="mb-3 text-xl font-black text-brand-teal-dark dark:text-white uppercase tracking-tight italic">Control de Diesel</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Monitoreo exacto de rendimiento. Registra cargas de diesel y obten reportes de consumo real por unidad y operador al instante.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="px-6 py-20 lg:px-20 bg-brand-teal-dark" id="testimonio">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute -top-10 -left-10 text-9xl text-white/5 font-black">&ldquo;</div>
                <blockquote className="relative z-10">
                  <p className="text-3xl lg:text-4xl font-bold text-brand-cream italic leading-tight mb-8">
                    &ldquo;Antes perdiamos dias cuadrando los fletes de la semana. Con Fleet Budget, mis operadores me mandan todo por WhatsApp y las liquidaciones estan listas el mismo viernes. Es la herramienta que el transporte en Mexico necesitaba.&rdquo;
                  </p>
                  <cite className="not-italic">
                    <span className="block text-brand-teal-accent font-black uppercase tracking-widest text-lg">Don Ricardo Mendez</span>
                    <span className="text-white/40 font-bold uppercase text-xs">Dueño de Flota - Transportes El Aguila</span>
                  </cite>
                </blockquote>
              </div>
              <div className="relative hidden lg:block">
                <div className="aspect-square rounded border-8 border-white/5 overflow-hidden">
                  <img
                    alt="Patio de maniobras"
                    className="w-full h-full object-cover grayscale opacity-40"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnlCUqNFhe6mgsUv1q24v3-pXj-oFwj4CC1s8kMgOl_YKychmIQ8ggSlHwYgqq8zPKbBhEe-hvKF-3gZaPf66O_oQinZj-oL8IR06vEBbd_VUmSuhVWwIRyn_5TG2JuSKP_ODSj6kautiYUUmtnIXDj2u7PY3qDG_TJ5alE7lpUJrUTu1ou1sG7A8xQzUNVTIJ13-ReCCSED4HPWKuY4jC9OK3TvaTGraDoFX1Gjz82W1lVI52mGIKKx8AdeDpxl3M5f-6cVUsGEc"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Liquidaciones */}
        <section className="px-6 py-20 lg:px-20 overflow-hidden bg-brand-cream dark:bg-background-dark">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="w-full lg:w-1/2">
                <h2 className="mb-6 text-4xl font-black text-brand-teal-dark dark:text-white uppercase italic leading-none">
                  Liquidaciones Rapidas <br /><span className="text-brand-teal-accent">Cuentas Claras</span>
                </h2>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 p-4 border-l-4 border-brand-teal-dark bg-brand-cream-dark dark:bg-slate-800">
                    <span className="material-symbols-outlined text-brand-teal-dark font-black">fact_check</span>
                    <div>
                      <p className="font-black text-brand-teal-dark dark:text-white uppercase text-sm">Validacion de CFDI ante el SAT</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">Evita problemas fiscales validando cada factura de diesel y casetas al momento.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 p-4 border-l-4 border-brand-teal-accent bg-brand-teal-accent/5 dark:bg-brand-teal-accent/10">
                    <span className="material-symbols-outlined text-brand-teal-accent font-black">account_balance_wallet</span>
                    <div>
                      <p className="font-black text-brand-teal-dark dark:text-white uppercase text-sm">Balance de Gastos de Viaje</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">Cierre de viajes sin errores. Calcula sobras, faltantes y bonos de operadores automaticamente.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 p-4 border-l-4 border-brand-teal-dark bg-brand-cream-dark dark:bg-slate-800">
                    <span className="material-symbols-outlined text-brand-teal-dark font-black">dashboard_customize</span>
                    <div>
                      <p className="font-black text-brand-teal-dark dark:text-white uppercase text-sm">Modulo de Mantenimiento</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">Control exhaustivo de llantas, servicios y gastos preventivos por unidad.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="w-full lg:w-1/2">
                <div className="bg-brand-teal-dark p-4 lg:p-6 shadow-2xl border border-white/10">
                  <div className="border border-white/5">
                    <img
                      alt="Pantalla de Sistema Logistico"
                      className="w-full"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnlCUqNFhe6mgsUv1q24v3-pXj-oFwj4CC1s8kMgOl_YKychmIQ8ggSlHwYgqq8zPKbBhEe-hvKF-3gZaPf66O_oQinZj-oL8IR06vEBbd_VUmSuhVWwIRyn_5TG2JuSKP_ODSj6kautiYUUmtnIXDj2u7PY3qDG_TJ5alE7lpUJrUTu1ou1sG7A8xQzUNVTIJ13-ReCCSED4HPWKuY4jC9OK3TvaTGraDoFX1Gjz82W1lVI52mGIKKx8AdeDpxl3M5f-6cVUsGEc"
                    />
                  </div>
                  <div className="mt-6 flex justify-between items-center text-white">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Rendimiento de Flota</p>
                      <p className="text-2xl font-black italic">+18% Eficiencia</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Ahorro en Diesel</p>
                      <p className="text-2xl font-black italic text-brand-teal-accent">MXN $12,400 / mes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 lg:px-20 bg-brand-cream-dark dark:bg-slate-900">
          <div className="mx-auto max-w-5xl bg-brand-teal-dark px-8 py-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <h2 className="mb-6 text-4xl font-black text-white lg:text-6xl uppercase italic tracking-tighter">
              ¿Listo para tomar el control de tus fletes?
            </h2>
            <p className="mb-10 text-lg text-brand-cream font-bold uppercase tracking-wider mx-auto max-w-2xl">
              Unete a las empresas transportistas que ya modernizaron su operacion con la tecnologia de Fleet Budget.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button className="h-16 rounded bg-brand-teal-accent px-12 text-base font-black uppercase tracking-widest text-white shadow-xl hover:bg-white hover:text-brand-teal-accent transition-all">
                Solicitar Demo Ahora
              </button>
              <button className="h-16 rounded border-2 border-white bg-transparent px-12 text-base font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                Hablar con un Experto
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-teal-dark/10 dark:border-slate-800 bg-white dark:bg-background-dark px-6 py-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-4">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="truck-logo-container">
                  <div className="truck-icon-wrapper scale-90">
                    <span className="material-symbols-outlined text-2xl text-brand-teal-accent -scale-x-100">local_shipping</span>
                  </div>
                  <div className="flex flex-col leading-[0.9]">
                    <span className="text-lg font-black tracking-tight text-brand-teal-dark uppercase">Fleet</span>
                    <span className="text-lg font-black tracking-tight text-brand-teal-dark uppercase">Budget</span>
                  </div>
                </div>
              </div>
              <p className="max-w-sm text-slate-600 dark:text-slate-400 mb-8 font-medium leading-relaxed uppercase text-xs tracking-wider">
                Soluciones tecnologicas de alto impacto para el sector de transporte de carga en Mexico. Liquidaciones automaticas, control de diesel y gestion de operadores.
              </p>
              <div className="flex gap-4">
                <a className="h-12 w-12 flex items-center justify-center bg-brand-cream dark:bg-slate-800 text-brand-teal-dark dark:text-white hover:bg-brand-teal-accent hover:text-white transition-all" href="#">
                  <span className="material-symbols-outlined">share</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-brand-teal-dark dark:text-white border-l-2 border-brand-teal-accent pl-3">Servicios</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Liquidacion de Fletes</a></li>
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Control de Diesel</a></li>
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Gastos de Viaje</a></li>
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Rendimientos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-brand-teal-dark dark:text-white border-l-2 border-brand-teal-accent pl-3">Operaciones</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Manual de Operador</a></li>
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Centro de Soporte</a></li>
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Contacto de Ventas</a></li>
                <li><a className="hover:text-brand-teal-accent transition-colors" href="#">Aviso de Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            &copy; 2024 Fleet Budget. Hecho para el camino en Mexico.
          </div>
        </div>
      </footer>
    </div>
  )
}
