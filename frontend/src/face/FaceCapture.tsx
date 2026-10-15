import { useEffect, useMemo, useRef, useState } from 'react'
import { FACE_CONFIG, type Step } from './config'
import { findFacesNearOval, takeSnapshot } from './frames'
import { evaluateFit, ovalForStep, type Fit } from './geometry'
import OvalOverlay from './OvalOverlay'
import { useAnimatedOval } from './useAnimatedOval'
import { useCamera } from './useCamera'
import { useFaceDetector } from './useFaceDetector'
import { useScreenSize } from './useScreenSize'
import './FaceCapture.css'

// The face capture: the camera shows only inside the oval, over a green
// cover. It starts on its own once the camera and the detector are ready:
// while the face is well placed, a ring fills around the oval; when it
// closes, the photo is taken (the oval flashes). Then the oval grows, the
// user moves closer and the second photo is taken the same way.

/** The two photos: the face in the normal oval and in the bigger one (closer). */
export interface FaceCaptures {
  first: Blob
  second: Blob
}

interface Props {
  /** The headline before starting. */
  title?: string
  onComplete: (captures: FaceCaptures) => void
  onCancel: () => void
}

/** A capture session; "try again" starts a fresh one. */
export default function FaceCapture(props: Props) {
  const [attempt, setAttempt] = useState(0)
  return <CaptureSession key={attempt} {...props} onRetry={() => setAttempt((n) => n + 1)} />
}

type Phase =
  | 'capturing' // looking for the face and filling the ring (once camera and detector are ready)
  | 'captured' // the photo of this step was just taken
  | 'growing' // the oval growing to step 2

const HINTS: Record<Fit, string> = {
  'no-face': 'Posicione o rosto dentro do oval',
  'many-faces': 'Apenas uma pessoa por vez',
  'off-center': 'Centralize o rosto no oval',
  'too-far': 'Aproxime um pouco o rosto',
  'too-close': 'Afaste um pouco o rosto',
  ok: 'Capturando… não se mexa',
}

function CaptureSession({ title = 'Encaixe o rosto no oval', onComplete, onCancel, onRetry }: Props & { onRetry: () => void }) {
  const screen = useScreenSize()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { state: camera, stop: stopCamera } = useCamera(videoRef)
  const { detector, error: detectorError } = useFaceDetector()
  const [phase, setPhase] = useState<Phase>('capturing')
  const [step, setStep] = useState<Step>(1)
  const [fit, setFit] = useState<Fit>('no-face')
  const [progress, setProgress] = useState(0)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const photos = useRef<Blob[]>([])

  const target = useMemo(() => ovalForStep(step, screen), [step, screen])
  const [oval, ovalRef] = useAnimatedOval(target, FACE_CONFIG.timing.growMs)

  const error = camera.status === 'failed' ? camera.message : (detectorError ?? captureError)
  const ready = camera.status === 'ready' && detector !== null

  // While capturing: detect the face on every new camera frame, fill the ring
  // while it fits. A face that slips out briefly keeps the ring where it is;
  // after that the ring empties, slowly. Full ring: photo.
  useEffect(() => {
    const video = videoRef.current
    if (phase !== 'capturing' || !detector || !video) return
    const { holdMs, graceMs, emptySlowdown } = FACE_CONFIG.timing
    let frame = 0
    let lastVideoTime = -1
    let last = performance.now()
    let current: Fit = 'no-face'
    let held = 0
    let outFor = 0 // ms since the face stopped fitting

    const tick = (now: number) => {
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime
        try {
          const faces = findFacesNearOval(detector, video, ovalRef.current, screen, now)
          current = evaluateFit(faces, ovalRef.current, step)
        } catch {
          setCaptureError('A detecção de rosto falhou. Tente de novo.')
          return
        }
        setFit(current)
      }
      const elapsed = now - last
      last = now
      if (current === 'ok') {
        outFor = 0
        held = Math.min(1, held + elapsed / holdMs)
      } else {
        outFor += elapsed
        if (outFor > graceMs) held = Math.max(0, held - elapsed / (holdMs * emptySlowdown))
      }
      setProgress(held)

      if (held < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      takeSnapshot(video, ovalRef.current, screen).then(
        (photo) => {
          photos.current[step - 1] = photo
          navigator.vibrate?.(60)
          setPhase('captured')
        },
        () => setCaptureError('Não foi possível tirar a foto. Tente de novo.'),
      )
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, step, detector, screen, ovalRef])

  // The transitions that happen on their own, timed with their animations.
  useEffect(() => {
    const { doneMs, growMs } = FACE_CONFIG.timing
    const after = (ms: number, then: () => void) => {
      const timer = setTimeout(then, ms)
      return () => clearTimeout(timer)
    }
    if (phase === 'captured' && step === 1)
      return after(doneMs, () => {
        setProgress(0)
        setFit('no-face')
        setStep(2)
        setPhase('growing')
      })
    if (phase === 'growing') return after(growMs + 150, () => setPhase('capturing'))
    if (phase === 'captured' && step === 2)
      return after(doneMs, () => {
        stopCamera()
        onComplete({ first: photos.current[0], second: photos.current[1] })
      })
  }, [phase, step, stopCamera, onComplete])

  const photosTaken = phase === 'captured' ? step : step - 1

  let headline = step === 1 ? title : 'Aproxime o rosto'
  let hint = HINTS[fit]
  if (!ready) {
    hint = camera.status === 'opening' ? 'Abrindo a câmera…' : 'Preparando a detecção de rosto…'
  } else if (phase === 'captured') {
    headline = step === 1 ? 'Primeira captura feita!' : 'Segunda captura feita!'
    hint = `Captura ${step} de 2 concluída`
  } else if (phase === 'growing') {
    headline = 'Agora aproxime o rosto'
    hint = 'O oval vai aumentar: encaixe o rosto de novo'
  }

  return (
    <main className="face-capture">
      <video ref={videoRef} className="face-capture__video" playsInline muted />

      <OvalOverlay
        screen={screen}
        oval={oval}
        progress={phase === 'captured' ? 1 : phase === 'capturing' ? progress : 0}
        flashKey={phase === 'captured' ? step : null}
      />

      <header className="face-capture__header">
        <h1>{headline}</h1>
        {ready && (
          <ol className="face-capture__steps" aria-label={`${photosTaken} de 2 capturas feitas`}>
            {[1, 2].map((n) => (
              <li key={n} className={n <= photosTaken ? 'done' : n === photosTaken + 1 ? 'current' : ''} />
            ))}
          </ol>
        )}
      </header>

      <div className="face-capture__footer" style={{ top: oval.cy + oval.ry + 28 }}>
        <p className={`face-capture__hint${phase === 'capturing' && fit === 'ok' ? ' face-capture__hint--ok' : ''}`} aria-live="polite">
          {phase === 'captured' && <span className="face-capture__check">✓</span>}
          {hint}
        </p>
        {step === 1 && phase !== 'captured' && (
          <button className="button button--link" onClick={onCancel}>
            Voltar
          </button>
        )}
      </div>

      {error && (
        <div className="face-capture__error" role="alert">
          <h1>Não foi possível continuar</h1>
          <p>{error}</p>
          <button className="button" onClick={onRetry}>
            Tentar de novo
          </button>
          <button className="button button--outline" onClick={onCancel}>
            Voltar ao início
          </button>
        </div>
      )}
    </main>
  )
}
