import { FACE_CONFIG, type Step } from './config'

// Pure math for the capture screen: the size of the oval, mapping between
// camera pixels and screen pixels, and whether a face fits the oval.

export interface Size {
  width: number
  height: number
}

export interface Oval {
  cx: number
  cy: number
  rx: number
  ry: number
}

/** A rectangle in pixels (camera or screen, depending on context). */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** The oval for a capture step, sized to fit the screen (portrait or landscape). */
export function ovalForStep(step: Step, screen: Size): Oval {
  const { aspectRatio, centerY, steps } = FACE_CONFIG.oval
  const { widthFraction, maxWidth, heightFraction } = steps[step]
  const width = Math.min(screen.width * widthFraction, maxWidth, (screen.height * heightFraction) / aspectRatio)
  return { cx: screen.width / 2, cy: screen.height * centerY, rx: width / 2, ry: (width * aspectRatio) / 2 }
}

export function lerpOval(from: Oval, to: Oval, t: number): Oval {
  const lerp = (a: number, b: number) => a + (b - a) * t
  return { cx: lerp(from.cx, to.cx), cy: lerp(from.cy, to.cy), rx: lerp(from.rx, to.rx), ry: lerp(from.ry, to.ry) }
}

/** The bounding box of an oval, grown by a factor on each axis. */
export function boxAroundOval(oval: Oval, scaleX: number, scaleY = scaleX): Box {
  const rx = oval.rx * scaleX
  const ry = oval.ry * scaleY
  return { x: oval.cx - rx, y: oval.cy - ry, width: rx * 2, height: ry * 2 }
}

/**
 * The video covers the screen (`object-fit: cover`) and is mirrored, like a
 * mirror. This is the scale and offset between camera and screen pixels.
 */
function framing(camera: Size, screen: Size) {
  const scale = Math.max(screen.width / camera.width, screen.height / camera.height)
  return {
    scale,
    dx: (screen.width - camera.width * scale) / 2,
    dy: (screen.height - camera.height * scale) / 2,
  }
}

/** Camera pixels → screen pixels (mirrored). */
export function cameraToScreen(box: Box, camera: Size, screen: Size): Box {
  const { scale, dx, dy } = framing(camera, screen)
  return {
    x: screen.width - (dx + (box.x + box.width) * scale),
    y: dy + box.y * scale,
    width: box.width * scale,
    height: box.height * scale,
  }
}

/** Screen pixels → camera pixels (undoing the mirror), clipped to the camera frame. */
export function screenToCamera(box: Box, camera: Size, screen: Size): Box {
  const { scale, dx, dy } = framing(camera, screen)
  const x0 = Math.max(0, (screen.width - (box.x + box.width) - dx) / scale)
  const x1 = Math.min(camera.width, (screen.width - box.x - dx) / scale)
  const y0 = Math.max(0, (box.y - dy) / scale)
  const y1 = Math.min(camera.height, (box.y + box.height - dy) / scale)
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

export type Fit = 'no-face' | 'many-faces' | 'off-center' | 'too-far' | 'too-close' | 'ok'

/** Whether the detected faces (in screen pixels) fit the oval of this step. */
export function evaluateFit(faces: Box[], oval: Oval, step: Step): Fit {
  if (faces.length === 0) return 'no-face'
  if (faces.length > 1) return 'many-faces'

  const { sizeRange, centerTolerance, centerOffsetY } = FACE_CONFIG.fit
  const [face] = faces
  const distance = Math.hypot(
    (face.x + face.width / 2 - oval.cx) / oval.rx,
    (face.y + face.height / 2 - (oval.cy + oval.ry * centerOffsetY)) / oval.ry,
  )
  const size = face.width / (oval.rx * 2)
  const [min, max] = sizeRange[step]

  if (size > max) return 'too-close'
  if (distance > centerTolerance) return 'off-center'
  if (size < min) return 'too-far'
  return 'ok'
}
