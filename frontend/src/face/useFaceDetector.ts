import { useEffect, useState } from 'react'
import { loadFaceDetector, type FaceDetector } from './detector'

/** The face detector, once loaded; or the error if it couldn't load. */
export function useFaceDetector() {
  const [detector, setDetector] = useState<FaceDetector | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadFaceDetector().then(
      (loaded) => active && setDetector(loaded),
      () => active && setError('Não foi possível carregar a detecção de rosto. Verifique a conexão e tente de novo.'),
    )
    return () => {
      active = false
    }
  }, [])

  return { detector, error }
}
