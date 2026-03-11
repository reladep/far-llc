import { useEffect, useRef } from 'react'

function scoreColor(v) {
  if (v < 40) return '#EF4444'
  if (v < 65) return '#F59E0B'
  return '#2DBD74'
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * ScoreRing
 * @param {number}  score        - target score (0–100)
 * @param {number}  size         - outer diameter in px
 * @param {number}  strokeWidth  - ring stroke width
 * @param {boolean} animate      - animate on mount
 * @param {number}  delay        - ms delay before animation starts
 * @param {string}  label        - center label (default "Score")
 * @param {boolean} showLabel    - show the label text
 */
export default function ScoreRing({
  score = 84,
  size = 88,
  strokeWidth = 7,
  animate = true,
  delay = 0,
  label = 'Score',
  showLabel = true,
  className = '',
}) {
  const circleRef = useRef(null)
  const numRef    = useRef(null)

  const r    = (size / 2) - strokeWidth - 2
  const circ = 2 * Math.PI * r
  const cx   = size / 2
  const cy   = size / 2

  useEffect(() => {
    const circle = circleRef.current
    const numEl  = numRef.current
    if (!circle || !animate) {
      if (circle) {
        circle.style.stroke = scoreColor(score)
        circle.style.strokeDashoffset = String(circ - circ * (score / 100))
      }
      if (numEl) numEl.textContent = String(score)
      return
    }

    // Start at 0
    circle.style.strokeDasharray  = String(circ)
    circle.style.strokeDashoffset = String(circ)
    circle.style.stroke           = scoreColor(0)
    if (numEl) numEl.textContent = '0'

    const startAnim = () => {
      let start = null
      const dur = 1800

      function step(ts) {
        if (!start) start = ts
        const p = Math.min((ts - start) / dur, 1)
        const e = easeOutCubic(p)
        const v = Math.round(e * score)
        const col = scoreColor(v)
        circle.style.stroke            = col
        circle.style.strokeDashoffset  = String(circ - circ * (v / 100))
        if (numEl) {
          numEl.textContent  = String(v)
          numEl.style.color  = col
        }
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    const timer = setTimeout(startAnim, delay)
    return () => clearTimeout(timer)
  }, [score, animate, delay, circ])

  const fontSize = size < 60 ? Math.round(size * 0.22) : Math.round(size * 0.24)
  const labelSize = size < 60 ? Math.round(size * 0.10) : Math.round(size * 0.11)

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block' }}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: animate ? undefined : 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
        />
      </svg>
      {/* Center numbers */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 1,
      }}>
        <span
          ref={numRef}
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: fontSize,
            fontWeight: 700,
            lineHeight: 1,
            color: scoreColor(0),
          }}
        >
          0
        </span>
        {showLabel && (
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: labelSize,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
