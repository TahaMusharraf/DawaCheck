'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

/**
 * Fetches `path` on mount and whenever it changes. Pass null to skip.
 * The last good data stays visible while a reload is in flight, so lists don't flash.
 */
export function useApi<T>(path: string | null) {
  const [nonce, setNonce] = useState(0)
  const key = path ? `${path}#${nonce}` : null
  const [state, setState] = useState<{ key: string | null; data?: T; error?: string }>({ key: null })

  useEffect(() => {
    if (!path || !key) return
    let active = true
    api<T>(path).then(
      (data) => active && setState({ key, data }),
      (e: Error) => active && setState((s) => ({ key, data: s.data, error: e.message })),
    )
    return () => {
      active = false
    }
  }, [path, key])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return {
    data: state.data,
    error: state.key === key ? state.error : undefined,
    loading: key !== null && state.key !== key,
    reload,
  }
}
