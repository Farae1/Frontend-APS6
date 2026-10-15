import { useId } from 'react'

// The "infinite energy crystal": a faceted gem that floats and glows.

const P = {
  top: '100,8',
  upperL: '52,70',
  upperML: '84,80',
  upperMR: '116,80',
  upperR: '148,70',
  lowerL: '52,190',
  lowerML: '84,200',
  lowerMR: '116,200',
  lowerR: '148,190',
  bottom: '100,252',
}

/** Each facet and how much white light it reflects (the shading). */
const FACETS: [string[], number][] = [
  [[P.top, P.upperL, P.upperML], 0.45],
  [[P.top, P.upperML, P.upperMR], 0.6],
  [[P.top, P.upperMR, P.upperR], 0.3],
  [[P.upperL, P.upperML, P.lowerML, P.lowerL], 0.18],
  [[P.upperML, P.upperMR, P.lowerMR, P.lowerML], 0.32],
  [[P.upperMR, P.upperR, P.lowerR, P.lowerMR], 0.06],
  [[P.lowerL, P.lowerML, P.bottom], 0.1],
  [[P.lowerML, P.lowerMR, P.bottom], 0.2],
  [[P.lowerMR, P.lowerR, P.bottom], 0],
]

export default function Crystal({ size = 180 }: { size?: number }) {
  const id = useId()
  return (
    <div className="crystal" style={{ width: size, height: size * 1.3 }}>
      <div className="crystal__halo" />
      <svg className="crystal__gem" viewBox="0 0 200 260" role="img" aria-label="Cristal de energia infinita">
        <defs>
          <linearGradient id={`${id}body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7df9d4" />
            <stop offset="0.5" stopColor="#18c39a" />
            <stop offset="1" stopColor="#5b4bdb" />
          </linearGradient>
          <linearGradient id={`${id}shine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}outline`}>
            <polygon points={[P.top, P.upperR, P.lowerR, P.bottom, P.lowerL, P.upperL].join(' ')} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}outline)`}>
          {FACETS.map(([points, light], i) => (
            <g key={i}>
              <polygon points={points.join(' ')} fill={`url(#${id}body)`} />
              <polygon points={points.join(' ')} fill="#fff" opacity={light} stroke="rgb(255 255 255 / 0.5)" strokeWidth="1" />
            </g>
          ))}
          <rect className="crystal__shine" x="-120" y="0" width="80" height="260" fill={`url(#${id}shine)`} />
        </g>
      </svg>
      <span className="crystal__spark" style={{ left: '12%', top: '20%' }} />
      <span className="crystal__spark" style={{ left: '84%', top: '36%', animationDelay: '0.8s' }} />
      <span className="crystal__spark" style={{ left: '22%', top: '78%', animationDelay: '1.6s' }} />
    </div>
  )
}
