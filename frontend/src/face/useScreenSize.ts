import { useEffect, useState } from 'react'
import type { Size } from './geometry'

const measure = (): Size => ({ width: window.innerWidth, height: window.innerHeight })

/** The window size, updated when it is resized or the phone rotates. */
export function useScreenSize(): Size {
  const [size, setSize] = useState(measure)
  useEffect(() => {
    const update = () => setSize(measure())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}
