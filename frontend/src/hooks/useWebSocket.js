import { useEffect, useRef, useCallback } from 'react'

export function useWebSocket(url, onMessage) {
  const ws = useRef(null)
  const onMsg = useRef(onMessage)
  onMsg.current = onMessage

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onmessage = (e) => {
      try { onMsg.current(JSON.parse(e.data)) } catch (_) {}
    }
    socket.onclose = () => {
      setTimeout(connect, 2000)
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => ws.current?.close()
  }, [connect])

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  return { send }
}
