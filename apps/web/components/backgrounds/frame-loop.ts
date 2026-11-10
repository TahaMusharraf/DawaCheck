/**
 * Calls `draw` every animation frame while `el` is on screen and the tab is visible.
 * People who prefer reduced motion get one still frame instead. `draw` receives the
 * frame timestamp and whether motion is reduced. Returns a cleanup function.
 */
export function runFrameLoop(el: Element, draw: (now: number, reduced: boolean) => void): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let frame = 0
  let visible = true

  const loop = (now: number) => {
    draw(now, reduced)
    if (visible && !document.hidden) frame = requestAnimationFrame(loop)
  }
  const start = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(loop)
  }

  if (reduced) {
    draw(performance.now(), true)
  } else {
    start()
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible && !reduced) start()
  })
  io.observe(el)
  const onVisibility = () => {
    if (!document.hidden && visible && !reduced) start()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    cancelAnimationFrame(frame)
    io.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
