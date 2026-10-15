import { FACE_CONFIG } from './config'
import type { FaceDetector } from './detector'
import { boxAroundOval, cameraToScreen, screenToCamera, type Box, type Oval, type Size } from './geometry'

// Working with the camera frames: cropping, finding faces around the oval
// and taking the photo.

function cameraSize(video: HTMLVideoElement): Size {
  return { width: video.videoWidth, height: video.videoHeight }
}

/** Draws a region of the current camera frame (camera pixels) into a canvas. */
function cropFrame(video: HTMLVideoElement, region: Box, canvas = document.createElement('canvas')) {
  const width = Math.max(1, Math.round(region.width))
  const height = Math.max(1, Math.round(region.height))
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  canvas.getContext('2d')!.drawImage(video, region.x, region.y, region.width, region.height, 0, 0, width, height)
  return canvas
}

const searchCanvas = document.createElement('canvas')

/**
 * Faces near the oval, in screen pixels. Only the region around the oval is
 * searched, not the whole frame: the face looks bigger to the model (which
 * misses faces that are small in the frame) and people off screen don't
 * count.
 */
export function findFacesNearOval(
  detector: FaceDetector,
  video: HTMLVideoElement,
  oval: Oval,
  screen: Size,
  timestampMs: number,
): Box[] {
  const camera = cameraSize(video)
  const { x, y } = FACE_CONFIG.searchArea
  const region = screenToCamera(boxAroundOval(oval, x, y), camera, screen)
  return detector
    .detect(cropFrame(video, region, searchCanvas), timestampMs)
    .map((face) => cameraToScreen({ ...face, x: region.x + face.x, y: region.y + face.y }, camera, screen))
}

/** The photo of what is inside the oval: not mirrored (the real image), as JPEG. */
export function takeSnapshot(video: HTMLVideoElement, oval: Oval, screen: Size): Promise<Blob> {
  const { margin, type, quality } = FACE_CONFIG.snapshot
  const region = screenToCamera(boxAroundOval(oval, 1 + margin), cameraSize(video), screen)
  const canvas = cropFrame(video, region)
  return new Promise((resolve, reject) =>
    canvas.toBlob((photo) => (photo ? resolve(photo) : reject(new Error('Could not encode the photo'))), type, quality),
  )
}
