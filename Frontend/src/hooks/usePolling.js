import { useEffect, useRef } from 'react'

/**
 * Lance fn() immédiatement puis toutes les `interval` ms.
 * S'arrête quand l'onglet est en arrière-plan et reprend au retour.
 * Se nettoie automatiquement au démontage du composant.
 */
export default function usePolling(fn, interval = 30000) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    fnRef.current()

    let timer = null

    const start = () => {
      timer = setInterval(() => {
        if (!document.hidden) fnRef.current()
      }, interval)
    }

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(timer)
      } else {
        fnRef.current()
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [interval])
}
