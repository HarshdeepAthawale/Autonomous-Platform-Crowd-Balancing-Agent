import { useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws/dashboard`
const MAX_LOG   = 50
const MAX_GRAPH = 120

export function useBackend() {
  const [platforms, setPlatforms] = useState({})
  const [log, setLog]             = useState([])
  const [graphSeries, setGraph]   = useState({})
  const [connected, setConnected] = useState(false)
  const [lastAnnouncement, setLastAnnouncement] = useState(null)  // { texts: {en,ja,hi}, nonce }

  const handleMessage = useCallback((msg) => {
    setConnected(true)

    if (msg.type === 'state_update' && Array.isArray(msg.platforms)) {
      setPlatforms(prev => {
        const next = { ...prev }
        msg.platforms.forEach(p => { next[p.platform_id] = p })
        return next
      })

    } else if (msg.type === 'agent_action' && msg.decision) {
      const d = msg.decision
      const entry = {
        id:           d.decision_id,
        ts:           d.ts,
        reasoning:    d.reasoning,
        actions:      d.actions_taken || [],
        plan:         d.plan,
        announcement: d.announcement,
        source:       d.source,
      }
      setLog(prev => [entry, ...prev.filter(e => e.id !== entry.id)].slice(0, MAX_LOG))
      const ann = d.announcement
      if (ann?.en || ann?.ja || ann?.hi) {
        setLastAnnouncement({ texts: { en: ann.en, ja: ann.ja, hi: ann.hi }, nonce: Date.now() })
      }

    } else if (msg.type === 'status_announcement' && msg.announcement) {
      const ann = msg.announcement
      if (ann?.en || ann?.ja || ann?.hi) {
        setLastAnnouncement({ texts: { en: ann.en, ja: ann.ja, hi: ann.hi }, nonce: Date.now() })
      }
      // Add every status tick to the log so the operator sees live heartbeats
      setLog(prev => [{
        id: `status_${msg.ts || Date.now()}`,
        ts: msg.ts || new Date().toISOString(),
        reasoning: msg.reasoning || msg.announcement?.en || '',
        actions: [],
        source: msg.source || 'rule',
        announcement: msg.announcement,
        isStatus: true,
      }, ...prev].slice(0, MAX_LOG))

    } else if (msg.type === 'override') {
      setLog(prev => prev.map(e => e.id === msg.action_id ? { ...e, overridden: true } : e))

    } else if (msg.type === 'graph_point') {
      setGraph(prev => {
        const series = prev[msg.platform_id] ?? []
        return { ...prev, [msg.platform_id]: [...series, { ts: msg.ts, density_pct: msg.density_pct }].slice(-MAX_GRAPH) }
      })
    }
  }, [])

  useWebSocket(WS_URL, handleMessage)

  const scanTicket = useCallback(async (platform_id, train_id = '12045') => {
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform_id, train_id }),
    })
  }, [])

  // Demo: drive synthetic CV density (camera-less path) so the gauge + graph
  // + agent all respond to the scan buttons (AppFlow §9).
  const pushDensity = useCallback(async (platform_id, count) => {
    await fetch('/api/density', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform_id, count }),
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

  return { platforms, log, graphSeries, connected, lastAnnouncement, scanTicket, pushDensity, triggerTick, overrideAction }
}
