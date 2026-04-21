import { useEffect, useRef, useState } from 'react'

const SCRIPT = [
  { type: 'driver-text', text: 'Cargué diesel saliendo de Querétaro' },
  { type: 'driver-photo', caption: 'Gasolina - 1,250', amount: 1250, concept: 'Gasolina' },
  { type: 'ack-received', text: '📸 Recibido, pendiente de revisión.' },
]

function WhatsAppBubble({ side, children, time }) {
  const isIncoming = side === 'in'
  return (
    <div className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-snug shadow-sm ${
          isIncoming
            ? 'bg-white text-neutral-900 rounded-tl-sm'
            : 'bg-[#d9fdd3] text-neutral-900 rounded-tr-sm'
        }`}
      >
        {children}
        <div className="text-[10px] text-neutral-500 mt-1 text-right">{time}</div>
      </div>
    </div>
  )
}

function TicketPhoto({ concept, amount, caption }) {
  return (
    <div className="w-[180px]">
      <div className="rounded-lg overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-300">
        <div className="h-[120px] flex flex-col items-center justify-center bg-white/80 relative">
          <div className="absolute top-2 left-2 text-[9px] font-mono text-neutral-500">PEMEX ****</div>
          <span className="material-icons text-primary-main text-4xl">local_gas_station</span>
          <div className="mt-1 text-[10px] font-mono text-neutral-700">TICKET #08421</div>
          <div className="text-[11px] font-bold text-neutral-900">${amount.toLocaleString('es-MX')}.00</div>
        </div>
      </div>
      {caption && (
        <div className="mt-1.5 text-[13px] text-neutral-800">{caption}</div>
      )}
    </div>
  )
}

export default function LandingDemo() {
  const [step, setStep] = useState(0) // 0 idle, 1-3 script playing, 4 pending, 7 approved, 8 rejected
  const [rejectionType, setRejectionType] = useState('soft')
  const [bellCount, setBellCount] = useState(0)
  const chatRef = useRef(null)

  const REJECT_REASON = 'Foto borrosa, por favor reenvía el ticket'

  const messages = []
  if (step >= 1) messages.push({ side: 'in', time: '10:42', content: <>Cargué diesel saliendo de Querétaro</> })
  if (step >= 2)
    messages.push({
      side: 'in',
      time: '10:43',
      content: <TicketPhoto concept="Gasolina" amount={1250} caption="Gasolina - 1,250" />,
    })
  if (step >= 3) messages.push({ side: 'out', time: '10:43', content: <>📸 Recibido, pendiente de revisión.</> })
  if (step === 7)
    messages.push({
      side: 'out',
      time: '10:47',
      content: (
        <>
          Hola Juan, tu gasto de <b>Gasolina</b> por <b>$1,250.00 MXN</b> fue <b>aprobado</b>.
        </>
      ),
    })
  if (step === 8)
    messages.push({
      side: 'out',
      time: '10:47',
      content: (
        <>
          Hola Juan, tu gasto de <b>Gasolina</b> por <b>$1,250.00 MXN</b> fue <b>rechazado</b>.
          <div className="mt-1 italic text-neutral-600">Motivo: {REJECT_REASON}</div>
          <div className="mt-1">
            {rejectionType === 'hard'
              ? 'Este gasto fue cerrado y no acepta reenvío.'
              : 'Por favor revisa y reenvía la evidencia.'}
          </div>
        </>
      ),
    })

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages.length, step])

  function play() {
    setStep(1)
    setTimeout(() => setStep(2), 800)
    setTimeout(() => {
      setStep(3)
      setBellCount(1)
    }, 1800)
    setTimeout(() => setStep(4), 2400)
  }

  function reset() {
    setStep(0)
    setRejectionType('soft')
    setBellCount(0)
  }

  function approve() {
    setStep(7)
    setBellCount(0)
  }

  function reject(type) {
    setRejectionType(type)
    setStep(8)
    setBellCount(0)
  }

  const status = step === 7 ? 'approved' : step === 8 ? 'rejected' : step >= 4 ? 'pending' : null

  return (
    <section className="px-6 py-20 lg:px-20 bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary-main bg-primary-subtle px-3 py-1 rounded mb-3">
            Cómo funciona
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-3">
            Pruébalo tú mismo
          </h2>
          <p className="text-neutral-500">
            Así se ve cuando un operador reporta un gasto por WhatsApp y tú lo revisas desde el dashboard.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Phone mockup — iPhone */}
          <div className="relative flex justify-center">
            <div className="relative">
              {/* Side buttons */}
              <div className="absolute -left-[3px] top-[120px] w-[3px] h-10 rounded-l bg-neutral-700" />
              <div className="absolute -left-[3px] top-[180px] w-[3px] h-16 rounded-l bg-neutral-700" />
              <div className="absolute -left-[3px] top-[260px] w-[3px] h-16 rounded-l bg-neutral-700" />
              <div className="absolute -right-[3px] top-[160px] w-[3px] h-24 rounded-r bg-neutral-700" />

              {/* Outer frame (titanium/graphite) */}
              <div className="w-[340px] rounded-[52px] bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-800 p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
                {/* Bezel */}
                <div className="rounded-[44px] bg-black p-[3px]">
                  {/* Screen */}
                  <div className="relative rounded-[42px] overflow-hidden bg-[#e5ddd5]">
                    {/* Dynamic Island */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[110px] h-[30px] rounded-full bg-black" />

                    {/* iOS status bar */}
                    <div className="bg-[#075e54] text-white flex items-center justify-between px-6 pt-2 pb-1.5 text-[13px] font-semibold relative z-10">
                      <span className="tracking-tight">9:41</span>
                      <span className="w-[110px]" />
                      <span className="flex items-center gap-1.5">
                        {/* Signal */}
                        <span className="flex items-end gap-[2px]">
                          <span className="w-[3px] h-[4px] bg-white rounded-sm" />
                          <span className="w-[3px] h-[6px] bg-white rounded-sm" />
                          <span className="w-[3px] h-[8px] bg-white rounded-sm" />
                          <span className="w-[3px] h-[10px] bg-white rounded-sm" />
                        </span>
                        {/* Wifi */}
                        <span className="material-icons text-[14px]">wifi</span>
                        {/* Battery */}
                        <span className="relative inline-flex items-center">
                          <span className="w-6 h-3 border border-white/80 rounded-[3px] relative">
                            <span className="absolute inset-[1.5px] bg-white rounded-[1.5px]" />
                          </span>
                          <span className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[6px] bg-white/80 rounded-r" />
                        </span>
                      </span>
                    </div>

                    {/* WhatsApp header */}
                    <div className="bg-[#075e54] text-white px-3 pb-2 flex items-center gap-2">
                      <span className="material-icons text-white/90 text-lg">arrow_back_ios</span>
                      <div className="w-8 h-8 rounded-full bg-primary-main/80 flex items-center justify-center shrink-0">
                        <span className="material-icons text-white text-base">person</span>
                      </div>
                      <div className="flex-1 leading-tight min-w-0">
                        <div className="text-[13px] font-semibold truncate">Juan Pérez · Chofer</div>
                        <div className="text-[10px] text-white/70">en línea</div>
                      </div>
                      <span className="material-icons text-white/90 text-lg">videocam</span>
                      <span className="material-icons text-white/90 text-lg">call</span>
                    </div>

                    {/* Chat background */}
                    <div
                      ref={chatRef}
                      className="h-[580px] overflow-y-auto px-3 py-4 flex flex-col gap-2"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='20' cy='20' r='1' fill='%23000' fill-opacity='0.04'/></svg>\")",
                      }}
                    >
                      {step === 0 && (
                        <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs italic">
                          Pulsa "Iniciar demo" para ver el flujo
                        </div>
                      )}
                      {messages.map((m, i) => (
                        <WhatsAppBubble key={i} side={m.side} time={m.time}>
                          {m.content}
                        </WhatsAppBubble>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="bg-[#f0f0f0] px-3 py-2 flex items-center gap-2">
                      <span className="material-icons text-neutral-500 text-lg">add_circle_outline</span>
                      <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2">
                        <span className="text-xs text-neutral-400 flex-1">Mensaje</span>
                        <span className="material-icons text-neutral-500 text-base">mood</span>
                      </div>
                      <span className="material-icons text-primary-main text-lg">mic</span>
                    </div>

                    {/* Home indicator */}
                    <div className="bg-[#f0f0f0] pb-2 pt-1 flex justify-center">
                      <span className="w-[110px] h-[5px] rounded-full bg-neutral-900/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="flex flex-col gap-4">
            {/* Top bar */}
            <div className="bg-white rounded-xl shadow-card border border-neutral-300/50 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-subtle flex items-center justify-center">
                  <span className="material-icons text-primary-main text-xl" style={{ transform: 'scaleX(-1)' }}>
                    local_shipping
                  </span>
                </div>
                <div>
                  <div className="text-xs text-neutral-500">Viaje QRO → CDMX</div>
                  <div className="text-sm font-bold text-neutral-900">Folio #FB-00123</div>
                </div>
              </div>
              <div className="relative">
                <button
                  className={`p-2 rounded-full transition-colors ${
                    bellCount > 0 ? 'bg-primary-subtle animate-pulse' : 'hover:bg-neutral-200'
                  }`}
                >
                  <span className="material-icons text-neutral-700">notifications</span>
                </button>
                {bellCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {bellCount}
                  </span>
                )}
              </div>
            </div>

            {/* Pending list */}
            <div className="bg-white rounded-xl shadow-card border border-neutral-300/50 overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-300/50 flex items-center justify-between">
                <h4 className="text-sm font-bold text-neutral-900">Gastos pendientes</h4>
                <span className="text-xs text-neutral-500">
                  {status === 'pending' ? '1 por revisar' : 'Todo al día'}
                </span>
              </div>

              <div className="p-4 min-h-[260px] flex flex-col gap-3">
                {!status && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500">
                    <span className="material-icons text-4xl text-neutral-300 mb-2">inbox</span>
                    <p className="text-sm">Sin gastos por ahora</p>
                  </div>
                )}

                {status && (
                  <div
                    className={`rounded-lg border p-3 transition-all ${
                      status === 'approved'
                        ? 'border-success-main/30 bg-success-light/40'
                        : status === 'rejected'
                          ? 'border-error-main/30 bg-error-light/40'
                          : 'border-neutral-300 bg-white hover:shadow-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-primary-subtle text-primary-main flex items-center justify-center shrink-0">
                        <span className="material-icons text-lg">local_gas_station</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-neutral-900 truncate">Gasolina</span>
                          <span className="text-sm font-bold text-neutral-900 tabular-nums">$1,250.00</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-neutral-500">Juan Pérez · hoy</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              status === 'approved'
                                ? 'bg-success-light text-success-main'
                                : status === 'rejected'
                                  ? rejectionType === 'hard'
                                    ? 'bg-error-main text-white'
                                    : 'bg-error-light text-error-main'
                                  : 'bg-warning-light text-warning-dark'
                            }`}
                          >
                            {status === 'approved'
                              ? 'Aprobado'
                              : status === 'rejected'
                                ? rejectionType === 'hard'
                                  ? 'Rechazo definitivo'
                                  : 'Rechazado'
                                : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 mt-3">
                        <button
                          onClick={() => reject('hard')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold text-neutral-500 hover:bg-error-main hover:text-white transition-all"
                          title="Rechazo definitivo — no acepta reenvío"
                        >
                          <span className="material-icons text-base">block</span>
                          Definitivo
                        </button>
                        <button
                          onClick={() => reject('soft')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold text-error-main bg-error-subtle hover:bg-error-main hover:text-white transition-all"
                          title="Rechazar — el chofer puede reenviar"
                        >
                          <span className="material-icons text-base">close</span>
                          Rechazar
                        </button>
                        <button
                          onClick={approve}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-primary-main bg-primary-subtle hover:bg-primary-main hover:text-white transition-all"
                        >
                          <span className="material-icons text-base">fact_check</span>
                          Aprobar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={reset}
                className="text-sm text-neutral-500 hover:text-neutral-900 font-semibold inline-flex items-center gap-1"
              >
                <span className="material-icons text-base">refresh</span>
                Reiniciar
              </button>
              {step === 0 ? (
                <button
                  onClick={play}
                  className="btn btn-primary inline-flex items-center gap-2 animate-heartbeat"
                >
                  <span className="material-icons text-base">play_arrow</span>
                  Iniciar demo
                </button>
              ) : (
                <span className="text-xs text-neutral-500">
                  {status === 'pending' && 'Aprueba o rechaza el gasto'}
                  {status === 'approved' && 'Listo — el chofer recibe la confirmación por WhatsApp'}
                  {status === 'rejected' &&
                    (rejectionType === 'hard'
                      ? 'Rechazo final — no acepta reenvío'
                      : 'Rechazado — el chofer puede mandar otra evidencia')}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
