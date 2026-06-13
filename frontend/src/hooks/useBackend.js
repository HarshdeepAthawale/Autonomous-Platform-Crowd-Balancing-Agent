import { useState, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'

const WS_URL = `ws://${window.location.host}/ws/dashboard`
const MAX_LOG   = 50
const MAX_GRAPH = 120

export function useBackend() {
  const [platforms, setPlatforms] = useState({})
  const [log, setLog]             = useState([])
  const [graphSeries, setGraph]   = useState({})   // { platform_id: [{ts, density_pct}] }
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  const handleMessage = useCallback((msg) => {
    setConnected(true)
    if (msg.type === 'state_update') {
      setPlatforms(prev => ({ ...prev, [msg.platform_id]: msg }))
    } else if (msg.type === 'agent_action') {
      setLog(prev => [{ ...msg, id: Date.now() + Math.random() }, ...prev].slice(0, MAX_LOG))
    } else if (msg.type === 'graph_point') {
      setGraph(prev => {
        const series = prev[msg.platform_id] ?? []
        return { ...prev, [msg.platform_id]: [...series, { ts: msg.ts, density_pct: msg.density_pct }].slice(-MAX_GRAPH) }
      })
    }
  }, [])

  wsRef.current = useWebSocket(WS_URL, handleMessage)

  const scanTicket = useCallback(async (platform_id, train_id = '12045') => {
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform_id, train_id }),
    })
  }, [])

  const triggerTick = useCallback(async () => {
    const res = await fetch('/api/agent/tick', { method: 'POST' })
    return res.json()
  }, [])

  const overrideAction = useCallback(async (action_id) => {
    await fetch('/api/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id, decision: 'cancel' }),
    })
  }, [])

  return { platforms, log, graphSeries, connected, scanTicket, triggerTick, overrideAction }
}
