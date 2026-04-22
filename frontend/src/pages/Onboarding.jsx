import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { plans } from './plans'
import PlanCard from './PlanCard'
import { onboardingRegister, onboardingActivate } from '../api'
import { setAuth } from '../auth'

const STEPS = [
  { id: 'plan', label: 'Plan' },
  { id: 'info', label: 'Informacion' },
  { id: 'payment', label: 'Pago' },
]

function Stepper({ currentStep }) {
  return (
    <ol className="flex items-center justify-center gap-4 mb-10">
      {STEPS.map((s, idx) => {
        const active = idx === currentStep
        const done = idx < currentStep
        return (
          <li key={s.id} className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors ${
                done
                  ? 'bg-primary-main border-primary-main text-white'
                  : active
                  ? 'border-primary-main text-primary-main'
                  : 'border-neutral-300 text-neutral-500'
              }`}
            >
              {done ? <span className="material-icons text-base">check</span> : idx + 1}
            </div>
            <span
              className={`text-sm font-semibold ${
                active ? 'text-neutral-900' : done ? 'text-primary-main' : 'text-neutral-500'
              }`}
            >
              {s.label}
            </span>
            {idx < STEPS.length - 1 && (
              <span className={`w-12 h-px ${done ? 'bg-primary-main' : 'bg-neutral-300'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function PlanStep({ selectedPlanId, onSelect }) {
  return (
    <div>
      <div className="mb-10 text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Elige tu plan</h2>
        <p className="text-neutral-500 text-sm">
          Puedes cambiar o cancelar en cualquier momento. Pagos en MXN.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        {plans.map((p) => {
          const active = selectedPlanId === p.id
          const otherSelected = !!selectedPlanId && !active
          return (
            <PlanCard
              key={p.id}
              plan={p}
              selected={active}
              selectable
              hideRecommended={otherSelected}
              buttonLabel={active ? 'Seleccionado' : 'Seleccionar'}
              onClick={() => onSelect(p.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children, error }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-error-main">{error}</p>}
    </div>
  )
}

function InfoStep({ info, setInfo, errors }) {
  const update = (key) => (e) => setInfo({ ...info, [key]: e.target.value })
  const toggleAccept = () => setInfo({ ...info, accept: !info.accept })
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Cuentanos de tu empresa</h2>
        <p className="text-neutral-500 text-sm">
          Vamos a crear tu cuenta de administrador para acceder al dashboard.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre de la empresa" error={errors.company}>
          <input
            type="text"
            value={info.company}
            onChange={update('company')}
            placeholder="Transportes ABC"
          />
        </Field>
        <Field label="Nombre del administrador" error={errors.adminName}>
          <input
            type="text"
            value={info.adminName}
            onChange={update('adminName')}
            placeholder="Juan Perez"
          />
        </Field>
        <Field label="Correo electronico" error={errors.email}>
          <input
            type="email"
            value={info.email}
            onChange={update('email')}
            placeholder="tu@empresa.com"
          />
        </Field>
        <div />
        <Field label="Contrasena" error={errors.password}>
          <input
            type="password"
            value={info.password}
            onChange={update('password')}
            placeholder="Minimo 8 caracteres"
          />
        </Field>
        <Field label="Confirmar contrasena" error={errors.confirmPassword}>
          <input
            type="password"
            value={info.confirmPassword}
            onChange={update('confirmPassword')}
            placeholder="Repite la contrasena"
          />
        </Field>
      </div>
      <label className="mt-4 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={info.accept}
          onChange={toggleAccept}
          className="mt-1 h-4 w-4 accent-primary-main"
        />
        <span className="text-sm text-neutral-700">
          Acepto los{' '}
          <a href="/terminos" target="_blank" rel="noreferrer" className="text-primary-main hover:underline">
            Terminos y Condiciones
          </a>{' '}
          y la{' '}
          <a href="/privacidad" target="_blank" rel="noreferrer" className="text-primary-main hover:underline">
            Politica de Privacidad
          </a>
          .
        </span>
      </label>
      {errors.accept && <p className="mt-1 text-xs text-error-main">{errors.accept}</p>}
    </div>
  )
}

function formatCardNumber(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(v) {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  if (digits.length < 3) return digits
  return digits.slice(0, 2) + '/' + digits.slice(2)
}

function PaymentStep({ payment, setPayment, errors, plan }) {
  const update = (key, formatter) => (e) => {
    const val = formatter ? formatter(e.target.value) : e.target.value
    setPayment({ ...payment, [key]: val })
  }
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Metodo de pago</h2>
        <p className="text-neutral-500 text-sm">
          Tu tarjeta se cargara{' '}
          <span className="font-semibold text-neutral-900">
            {plan.price}
            {plan.priceUnit || ''}
          </span>{' '}
          a partir del primer mes. Puedes cancelar antes sin cargo.
        </p>
      </div>
      <div className="rounded-xl border border-neutral-300/60 bg-white p-6">
        <Field label="Nombre en la tarjeta" error={errors.cardName}>
          <input
            type="text"
            value={payment.cardName}
            onChange={update('cardName')}
            placeholder="Como aparece en la tarjeta"
          />
        </Field>
        <Field label="Numero de tarjeta" error={errors.cardNumber}>
          <input
            type="text"
            inputMode="numeric"
            value={payment.cardNumber}
            onChange={update('cardNumber', formatCardNumber)}
            placeholder="1234 5678 9012 3456"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vencimiento (MM/AA)" error={errors.expiry}>
            <input
              type="text"
              inputMode="numeric"
              value={payment.expiry}
              onChange={update('expiry', formatExpiry)}
              placeholder="12/28"
            />
          </Field>
          <Field label="CVV" error={errors.cvv}>
            <input
              type="text"
              inputMode="numeric"
              value={payment.cvv}
              onChange={(e) =>
                setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })
              }
              placeholder="123"
            />
          </Field>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
          <span className="material-icons text-base">lock</span>
          <span>Pago seguro. No almacenamos tu tarjeta en nuestros servidores.</span>
        </div>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialPlanId = useMemo(() => {
    const q = searchParams.get('plan')
    return plans.find((p) => p.id === q)?.id || 'pyme'
  }, [searchParams])

  const [stepIdx, setStepIdx] = useState(0)
  const [planId, setPlanId] = useState(initialPlanId)
  const [info, setInfo] = useState({
    company: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accept: false,
  })
  const [payment, setPayment] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [registered, setRegistered] = useState(false)

  const selectedPlan = plans.find((p) => p.id === planId) || plans[1]
  const isEmpresa = selectedPlan.id === 'empresa'

  const validateInfo = () => {
    const e = {}
    if (!info.company.trim()) e.company = 'Requerido'
    if (!info.adminName.trim()) e.adminName = 'Requerido'
    if (!/^\S+@\S+\.\S+$/.test(info.email)) e.email = 'Correo invalido'
    if (info.password.length < 8) e.password = 'Minimo 8 caracteres'
    if (info.password !== info.confirmPassword) e.confirmPassword = 'Las contrasenas no coinciden'
    if (!info.accept) e.accept = 'Debes aceptar los terminos'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validatePayment = () => {
    const e = {}
    if (!payment.cardName.trim()) e.cardName = 'Requerido'
    const digits = payment.cardNumber.replace(/\s/g, '')
    if (digits.length < 13 || digits.length > 19) e.cardNumber = 'Numero invalido'
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) e.expiry = 'Usa formato MM/AA'
    if (payment.cvv.length < 3) e.cvv = 'CVV invalido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const registerWithApi = async () => {
    setServerError(null)
    setSubmitting(true)
    try {
      const res = await onboardingRegister({
        plan: planId,
        company_name: info.company.trim(),
        admin_name: info.adminName.trim(),
        email: info.email.trim().toLowerCase(),
        password: info.password,
      })
      setAuth(res.access_token, res.user)
      setRegistered(true)
      return true
    } catch (e) {
      setServerError(e.message || 'No se pudo crear la cuenta')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const activateWithApi = async () => {
    setServerError(null)
    setSubmitting(true)
    try {
      await onboardingActivate({
        card_name: payment.cardName.trim(),
        card_number: payment.cardNumber.replace(/\s/g, ''),
        expiry: payment.expiry,
        cvv: payment.cvv,
      })
      setDone(true)
    } catch (e) {
      setServerError(e.message || 'No se pudo procesar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  const next = async () => {
    if (stepIdx === 0) {
      setStepIdx(1)
      return
    }
    if (stepIdx === 1) {
      if (!validateInfo()) return
      if (!registered) {
        const ok = await registerWithApi()
        if (!ok) return
      }
      if (isEmpresa) {
        setDone(true)
        return
      }
      setErrors({})
      setStepIdx(2)
      return
    }
    if (stepIdx === 2) {
      if (!validatePayment()) return
      await activateWithApi()
    }
  }

  const back = () => {
    if (stepIdx === 0) {
      navigate('/landing')
      return
    }
    if (registered) {
      return
    }
    setErrors({})
    setServerError(null)
    setStepIdx((s) => s - 1)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full bg-white rounded-xl shadow-card p-8 text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-primary-subtle flex items-center justify-center">
            <span className="material-icons text-primary-main text-3xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {isEmpresa ? 'Solicitud recibida' : 'Bienvenido a Fleet Budget'}
          </h2>
          <p className="text-neutral-500 text-sm mb-6">
            {isEmpresa
              ? 'Un especialista te contactara en menos de 24 horas para armar tu plan Empresa.'
              : `Tu plan ${selectedPlan.name} quedo activado. Ya puedes iniciar sesion y empezar a registrar viajes.`}
          </p>
          <Link to="/login" className="btn btn-primary w-full">
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  const stepLabel = isEmpresa && stepIdx === 1 ? 'Enviar solicitud' : 'Continuar'
  const finalStepIdx = isEmpresa ? 1 : 2
  const isFinal = stepIdx === finalStepIdx

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-neutral-300/50 px-6 lg:px-20 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/landing" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-subtle">
              <span className="material-icons text-primary-main text-xl" style={{ transform: 'scaleX(-1)' }}>local_shipping</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-extrabold text-neutral-900 tracking-tight">Fleet</span>
              <span className="text-sm font-extrabold text-neutral-900 tracking-tight">Budget</span>
            </div>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-neutral-600 hover:text-primary-main">
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      <main className="px-6 py-10 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <Stepper currentStep={stepIdx} />

          <div className="bg-white rounded-xl shadow-card p-6 md:p-10">
            {stepIdx === 0 && <PlanStep selectedPlanId={planId} onSelect={setPlanId} />}
            {stepIdx === 1 && <InfoStep info={info} setInfo={setInfo} errors={errors} />}
            {stepIdx === 2 && !isEmpresa && (
              <PaymentStep
                payment={payment}
                setPayment={setPayment}
                errors={errors}
                plan={selectedPlan}
              />
            )}

            {serverError && (
              <div className="mt-6 rounded bg-error-main/10 border border-error-main/30 p-3 text-sm text-error-main">
                {serverError}
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={back}
                disabled={registered}
                className="btn btn-ghost border border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-icons text-base mr-1">chevron_left</span>
                {stepIdx === 0 ? 'Volver al inicio' : 'Atras'}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={submitting}
                className="btn btn-primary min-w-[180px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Procesando...'
                  : isFinal
                  ? isEmpresa
                    ? 'Enviar solicitud'
                    : 'Confirmar y pagar'
                  : stepLabel}
                {!submitting && !isFinal && (
                  <span className="material-icons text-base">chevron_right</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
