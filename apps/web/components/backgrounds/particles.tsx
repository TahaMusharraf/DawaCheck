'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { runFrameLoop } from './frame-loop'

type Dot = { x: number; y: number; z: number; phase: number; sway: number }

/**
 * Soft motes drifting upwards, in the spirit of React Bits' Particles but on a 2D canvas:
 * a few dozen sprites is far cheaper than a WebGL context. Nearer motes are larger,
 * brighter, faster and shift more with the pointer, which gives a gentle parallax.
 */
export function Particles({
  color = '#cdffdc',
  density = 1,
  className,
}: {
  color?: string
  density?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // One pre-rendered glow sprite, stamped for every mote.
    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 64
    const sctx = sprite.getContext('2d')!
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, color)
    g.addColorStop(0.25, `${color}aa`)
    g.addColorStop(1, `${color}00`)
    sctx.fillStyle = g
    sctx.fillRect(0, 0, 64, 64)

    let dots: Dot[] = []
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const seed = () => {
      const count = Math.round(Math.min(Math.max((w * h) / 22000, 16), 70) * density)
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.25 + Math.random() * 0.75,
        phase: Math.random() * Math.PI * 2,
        sway: 6 + Math.random() * 18,
      }))
    }

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5
      pointer.y = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let last = performance.now()
    const stop = runFrameLoop(canvas, (now, reduced) => {
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      pointer.sx += (pointer.x - pointer.sx) * 0.04
      pointer.sy += (pointer.y - pointer.sy) * 0.04
      ctx.clearRect(0, 0, w, h)
      const t = now / 1000
      for (const d of dots) {
        if (!reduced) {
          d.y -= (0.08 + d.z * 0.28) * dt
          if (d.y < -20) {
            d.y = h + 20
            d.x = Math.random() * w
          }
        }
        const size = 3 + d.z * 9
        const x = d.x + Math.sin(t * 0.4 + d.phase) * d.sway - pointer.sx * 40 * d.z
        const y = d.y - pointer.sy * 30 * d.z
        ctx.globalAlpha = (0.25 + 0.6 * d.z) * (0.6 + 0.4 * Math.sin(t * 1.3 + d.phase * 3))
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size)
      }
      ctx.globalAlpha = 1
    })

    return () => {
      stop()
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [color, density])

  return <canvas ref={canvasRef} aria-hidden className={cn('size-full', className)} />
}
