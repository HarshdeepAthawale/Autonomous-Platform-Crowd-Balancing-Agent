import { useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

// Passenger signage channel: /ws/display/{platformId}
// Receives `signage` and `redirect` messages from the Action Agent.
export function useDisplay(platformId) {
  const [signage, setSignage]   = useState(null)
  const [redirect, setRedirect] = useState(null)
  const [connected, setConnected] = useState(false)

  const url = `ws://${window.location.host}/ws/display/${platformId}`

  const handleMessage = useCallback((msg) => {
    setConnected(true)
    if (msg.type === 'signage')  setSignage(msg)
    else if (msg.type === 'redirect') setRedirect(msg)
  }, [])

  useWebSocket(url, handleMessage)

  return { signage, redirect, connected }
}
