import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { FACE_CONFIG } from './config'

export type CameraState = { status: 'opening' } | { status: 'ready' } | { status: 'failed'; message: string }

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

/** A message for each reason the camera may not open. */
function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError') return 'Precisamos da permissão para usar a câmera. Libere o acesso no navegador e tente de novo.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Não encontramos uma câmera neste aparelho.'
  if (name === 'NotReadableError') return 'A câmera está em uso por outro aplicativo. Feche-o e tente de novo.'
  return 'Não foi possível abrir a câmera.'
}

/**
 * Opens the front camera into the video element and closes it when the
 * component unmounts. `stop` turns it off earlier (the camera light goes out).
 */
export function useCamera(videoRef: RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<CameraState>({ status: 'opening' })
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState({ status: 'failed', message: 'A câmera só funciona em uma conexão segura (HTTPS) ou em localhost.' })
        return
      }
      try {
        const { width, height } = FACE_CONFIG.camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: width }, height: { ideal: height } },
          audio: false,
        })
        if (!active) return stopStream(stream)
        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        if (active) setState({ status: 'ready' })
      } catch (error) {
        if (active) setState({ status: 'failed', message: cameraErrorMessage(error) })
      }
    })()
    return () => {
      active = false
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [videoRef])

  const stop = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
  }, [])

  return { state, stop }
}
