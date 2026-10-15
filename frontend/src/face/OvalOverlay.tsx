import { useId } from 'react'
import type { Oval, Size } from './geometry'

interface Props {
  screen: Size
  oval: Oval
  /** How much of the ring around the oval is drawn, from 0 to 1. */
  progress: number
  /** Changes on every photo taken: makes the oval flash. */
  flashKey: number | null
}

/** Space between the oval and the ring around it, in pixels. */
const RING_GAP = 7

/**
 * The green cover with an oval hole (the camera shows only through it), the
 * progress ring around the oval and the flash of each photo.
 */
export default function OvalOverlay({ screen, oval, progress, flashKey }: Props) {
  const maskId = useId()
  const { cx, cy } = oval
  const rx = oval.rx + RING_GAP
  const ry = oval.ry + RING_GAP
  // The ring as a path starting at the top, so progress grows clockwise from there.
  const ring = `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy - ry}`

  return (
    <svg className="face-overlay" width={screen.width} height={screen.height} aria-hidden>
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          <ellipse cx={cx} cy={cy} rx={oval.rx} ry={oval.ry} fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" className="face-overlay__cover" mask={`url(#${maskId})`} />
      <path d={ring} className="face-overlay__track" />
      <path
        d={ring}
        className="face-overlay__progress"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - progress * 100}
        opacity={progress > 0 ? 1 : 0}
      />
      {flashKey !== null && (
        <ellipse key={flashKey} cx={cx} cy={cy} rx={oval.rx} ry={oval.ry} className="face-overlay__flash" />
      )}
    </svg>
  )
}
