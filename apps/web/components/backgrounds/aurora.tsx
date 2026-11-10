'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { runFrameLoop } from './frame-loop'

// Adapted from the idea behind React Bits' Aurora / Soft Aurora backgrounds: a full-screen
// fragment shader of domain-warped simplex noise, with a soft ribbon of light drifting across
// the upper third. Written against plain WebGL 1 so it needs no dependency.

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uAlpha;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float f = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    f += a * snoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return f;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y;
  float t = uTime * 0.035;

  vec2 q = vec2(fbm(p * 1.1 + vec2(0.0, t)), fbm(p * 1.1 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.3 + q * 1.6 + vec2(1.7, 9.2) + t * 0.8), fbm(p * 1.3 + q * 1.6 + vec2(8.3, 2.8) - t * 0.6));
  float k = clamp(fbm(p * 1.2 + r * 1.4) * 0.5 + 0.5, 0.0, 1.0);

  vec3 col = mix(uC0, uC1, smoothstep(0.15, 0.75, k));
  col = mix(col, uC2, smoothstep(0.35, 1.0, length(q)) * 0.85);

  float wave = snoise(vec2(p.x * 0.9 + t * 1.5, t * 0.7)) * 0.09;
  float band = exp(-pow((uv.y - 0.74 - wave) * 5.5, 2.0));
  col = mix(col, uC3, band * 0.55 * smoothstep(-0.3, 0.6, r.y));

  float a = uAlpha * (0.7 + 0.3 * k);
  gl_FragColor = vec4(col * a, a);
}
`

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export type AuroraColors = [string, string, string, string]

/**
 * Slow, organic flowing gradient. `colors` are [base, body, highlight, ribbon]; changing them
 * eases the shader to the new palette instead of snapping. Renders at half resolution (the
 * image is soft anyway); see runFrameLoop for pausing and reduced motion.
 */
export function Aurora({
  colors,
  opacity = 1,
  speed = 1,
  className,
}: {
  colors: AuroraColors
  opacity?: number
  speed?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const target = useRef(colors.map(hexToRgb))

  useEffect(() => {
    target.current = colors.map(hexToRgb)
  }, [colors])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    // One triangle that covers the whole viewport.
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(prog, name)
    const uRes = u('uRes')
    const uTime = u('uTime')
    const uAlpha = u('uAlpha')
    const uColors = [u('uC0'), u('uC1'), u('uC2'), u('uC3')]
    const current = target.current.map((c) => [...c])

    const resize = () => {
      const scale = 0.5
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // A random start so two backgrounds on screen don't move in lockstep.
    let time = Math.random() * 200
    let last = performance.now()

    const stop = runFrameLoop(canvas, (now) => {
      // Capped so a background tab coming back doesn't jump the animation forward.
      time += (Math.min(now - last, 50) / 1000) * speed
      last = now
      for (let i = 0; i < 4; i++) {
        for (let c = 0; c < 3; c++) current[i][c] += (target.current[i][c] - current[i][c]) * 0.04
        gl.uniform3fv(uColors[i], current[i])
      }
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, time)
      gl.uniform1f(uAlpha, opacity)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      canvas.dataset.ready = 'true'
    })

    return () => {
      stop()
      ro.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [opacity, speed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('size-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100', className)}
    />
  )
}
