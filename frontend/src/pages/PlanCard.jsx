export default function PlanCard({
  plan,
  buttonLabel,
  onClick,
  selected = false,
  selectable = false,
  hideRecommended = false,
}) {
  const showRecommended = plan.recommended && !hideRecommended
  const border = showRecommended
    ? 'border-2 border-primary-main shadow-dropdown'
    : 'border border-neutral-300/60 shadow-card'
  const selectedRing = selected ? 'ring-4 ring-primary-main/30 border-primary-main' : ''

  const interactive = selectable
    ? 'cursor-pointer hover:border-primary-main hover:shadow-dropdown'
    : ''

  const handleCardClick = selectable ? onClick : undefined

  return (
    <div
      onClick={handleCardClick}
      className={`relative flex flex-col bg-white rounded-xl p-8 transition-all ${border} ${selectedRing} ${interactive}`}
    >
      {selected && (
        <span className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-full bg-primary-main text-white">
          <span className="material-icons text-base">check</span>
        </span>
      )}
      {showRecommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-main text-white text-[11px] font-bold uppercase tracking-[1px] rounded">
          Recomendado
        </span>
      )}
      <h3 className="text-lg font-bold text-neutral-900 mb-1">{plan.name}</h3>
      <p className="text-sm text-neutral-500 mb-5">{plan.tagline}</p>
      <p className="text-4xl font-bold text-neutral-900 mb-1">
        {plan.price}
        {plan.priceUnit && (
          <span className="text-base font-medium text-neutral-500">{plan.priceUnit}</span>
        )}
      </p>
      <p className="text-xs text-neutral-500 mb-6">{plan.priceFootnote}</p>
      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="material-icons text-primary-main text-base mt-0.5">check_circle</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(e)
        }}
        className={
          selected || showRecommended ? 'btn btn-primary w-full' : 'btn btn-soft w-full'
        }
      >
        {buttonLabel}
      </button>
    </div>
  )
}
