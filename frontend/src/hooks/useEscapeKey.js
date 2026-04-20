import { useEffect } from 'react'

export default function useEscapeKey(onEscape, active = true) {
  useEffect(() => {
    if (!active) return
    function handle(e) {
      if (e.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onEscape, active])
}
