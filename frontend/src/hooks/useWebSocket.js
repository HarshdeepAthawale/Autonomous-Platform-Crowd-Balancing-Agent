import { useEffect, useRef, useCallback } from 'react'

export function useWebSocket(url, onMessage) {
  const ws       = useRef(null)
  const onMsg    = useRef(onMessage)
  const retryRef = useRef(null)

  // Always use the latest callback without reconnecting
  useEffect(() => { onMsg.current = onMessage })

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN ||
        ws.current?.readyState === WebSocket.CONNECTING) return

    clearTimeout(retryRef.current)
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onmessage = (e) => {
      try { onMsg.current(JSON.parse(e.data)) } catch {}
    }

    socket.onclose = () => {
      // Retry after 2s; recurse so the new socket also auto-retries
      retryRef.current = setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) connect()
      }, 2000)
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryRef.current)
      ws.current?.close()
    }
  }, [connect])

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }, [])

  return { send }
}
