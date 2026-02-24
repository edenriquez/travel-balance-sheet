import { useState, useEffect, useCallback } from 'react'

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))
}

export default function EvidenceGalleryModal({ open, items, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex ?? 0)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    if (open) {
      setIndex(startIndex ?? 0)
      setImgLoaded(false)
    }
  }, [open, startIndex])

  const goPrev = useCallback(() => {
    setImgLoaded(false)
    setIndex((i) => (i > 0 ? i - 1 : items.length - 1))
  }, [items.length])

  const goNext = useCallback(() => {
    setImgLoaded(false)
    setIndex((i) => (i < items.length - 1 ? i + 1 : 0))
  }, [items.length])

  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose, goPrev, goNext])

  if (!open || !items || items.length === 0) return null

  const current = items[index]
  if (!current) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={onClose} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/40">
        <div className="flex items-center gap-4 text-white min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-icons text-primary">image</span>
            <h3 className="font-bold text-lg truncate">{current.concept}</h3>
          </div>
          <span className="text-white/50">|</span>
          <span className="text-white/70 text-sm font-medium">{formatMoney(current.amount)}</span>
          <span className="text-white/50">|</span>
          <span className="text-white/50 text-sm">{index + 1} / {items.length}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <span className="material-icons text-2xl">close</span>
        </button>
      </div>

      {/* Image area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-16 py-6 min-h-0">
        {/* Prev button */}
        {items.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-icons text-2xl">chevron_left</span>
          </button>
        )}

        {/* Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-icons text-white/40 text-4xl animate-spin">progress_activity</span>
            </div>
          )}
          <img
            src={current.evidence_url}
            alt={`Evidencia: ${current.concept}`}
            className={`max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
          />
        </div>

        {/* Next button */}
        {items.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-icons text-2xl">chevron_right</span>
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="relative z-10 bg-black/40 px-6 py-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => { setImgLoaded(false); setIndex(i) }}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  i === index
                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={item.evidence_url}
                  alt={item.concept}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
