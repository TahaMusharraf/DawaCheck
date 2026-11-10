import { AmbientBackground } from '@/components/backgrounds/ambient'
import type { Tone } from './verdict-config'

/** The animated aurora, tinted with the verdict's colour. It eases to the new tint when the verdict arrives. */
export function Backdrop({ tone }: { tone: Tone }) {
  return <AmbientBackground colors={tone.aurora} fixed />
}
