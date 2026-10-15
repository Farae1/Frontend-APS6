import { useEffect, useRef, useState } from 'react'
import { lerpOval, type Oval } from './geometry'

/** Slow at the start and at the end: the change of size feels smooth. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * The oval on screen, easing towards `target` whenever it changes (the second
 * step, or the screen rotated). Also returns a ref with the current frame's
 * value, for code that reads it outside rendering (detection, snapshot).
 */
export function useAnimatedOval(target: Oval, durationMs: number) {
  const [oval, setOval] = useState(target)
  const current = useRef(target)
  const { cx, cy, rx, ry } = target

  useEffect(() => {
    const from = current.current
    const to = { cx, cy, rx, ry }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      current.current = lerpOval(from, to, easeInOutCubic(t))
      setOval(current.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [cx, cy, rx, ry, durationMs])

  return [oval, current] as const
}
