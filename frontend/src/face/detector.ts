import { FaceDetector as MediaPipeFaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { FACE_CONFIG } from './config'
import type { Box } from './geometry'

// The face detection model. This is the only file that knows about MediaPipe:
// to try another model, write another `FaceDetector` here and nothing else
// changes.

export interface FaceDetector {
  /** Faces found in the image, in the image's own pixels. */
  detect(image: HTMLCanvasElement, timestampMs: number): Box[]
}

const base = import.meta.env.BASE_URL

async function createMediaPipe(): Promise<FaceDetector> {
  const files = await FilesetResolver.forVisionTasks(base + FACE_CONFIG.model.wasmPath)
  const model = await MediaPipeFaceDetector.createFromOptions(files, {
    // The CPU (WebAssembly): the model is tiny (128x128 input) and takes a few
    // ms per frame. The GPU (WebGL) gained little and could hang or lose its
    // context on some devices.
    baseOptions: { modelAssetPath: base + FACE_CONFIG.model.modelPath, delegate: 'CPU' },
    runningMode: 'VIDEO',
    minDetectionConfidence: FACE_CONFIG.model.minConfidence,
  })
  return {
    detect: (image, timestampMs) =>
      model.detectForVideo(image, timestampMs).detections.flatMap(({ boundingBox: b }) =>
        b ? [{ x: b.originX, y: b.originY, width: b.width, height: b.height }] : [],
      ),
  }
}

let loading: Promise<FaceDetector> | null = null

/** Loads the detector once; later calls reuse it. */
export function loadFaceDetector(): Promise<FaceDetector> {
  if (!loading) {
    loading = createMediaPipe()
    loading.catch(() => {
      loading = null
    })
  }
  return loading
}
