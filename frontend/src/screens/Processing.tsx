import { useEffect, useRef, useState } from 'react'
import { ApiError, type FailureReason } from '../api/types'
import { Camera, Lock } from '../components/Icons'

export type Outcome<T> = { ok: true; value: T } | { ok: false; reason: FailureReason }

/** Minimum time on this screen, so it can be read even when the answer is fast. */
const MIN_MS = 1600

async function run<T>(task: () => Promise<T>): Promise<Outcome<T>> {
  const minimum = new Promise((resolve) => setTimeout(resolve, MIN_MS))
  try {
    const value = await task()
    await minimum
    return { ok: true, value }
  } catch (error) {
    await minimum
    return { ok: false, reason: error instanceof ApiError ? error.reason : 'server-error' }
  }
}

interface Props<T> {
  title: string
  /** The second step shown, e.g. "Verificando identidade…". */
  working: string
  task: () => Promise<T>
  onDone: (outcome: Outcome<T>) => void
}

/** "Validando suas informações": runs the request while showing progress. */
export default function Processing<T>({ title, working, task, onDone }: Props<T>) {
  // A single request, even though effects run twice in development mode.
  const request = useRef<Promise<Outcome<T>> | null>(null)
  const [showWorking, setShowWorking] = useState(false)

  useEffect(() => {
    request.current ??= run(task)
    let active = true
    const timer = setTimeout(() => setShowWorking(true), 700)
    request.current.then((outcome) => active && onDone(outcome))
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [task, onDone])

  return (
    <main className="panel processing">
      <h1>{title}</h1>

      <div className="processing__center">
        <div className="spinner" role="progressbar" aria-label={title}>
          <Camera size={40} />
        </div>
        <ul className="processing__steps" aria-live="polite">
          <li className="done">✓ Captura validada</li>
          <li className={showWorking ? 'current' : 'waiting'}>{working}</li>
        </ul>
      </div>

      <p className="secure-footer">
        <Lock size={18} /> Ministério do Meio Ambiente
      </p>
    </main>
  )
}
