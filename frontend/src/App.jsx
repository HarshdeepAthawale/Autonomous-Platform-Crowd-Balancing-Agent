import { Routes, Route } from 'react-router-dom'
import Dashboard    from './pages/Dashboard'
import SignageBoard from './pages/SignageBoard'
import GateDisplay  from './pages/GateDisplay'
import './index.css'

function JapanWatermark() {
  return (
    <>
      {/* Base photo — covers the full viewport, very low opacity */}
      <img
        src="/japan1.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
          opacity: 0.54,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
        }}
      />
      {/* Gradient veil — fades edges to paper colour so text stays readable */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: [
            'linear-gradient(to bottom, rgba(244,238,227,0.35) 0%, rgba(244,238,227,0.04) 15%, rgba(244,238,227,0.04) 82%, rgba(244,238,227,0.40) 100%)',
            'linear-gradient(to right,  rgba(244,238,227,0.30) 0%, rgba(244,238,227,0.02) 8%,  rgba(244,238,227,0.02) 92%, rgba(244,238,227,0.30) 100%)',
          ].join(', '),
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4EEE3', position: 'relative' }}>
      <div className="washi-grain" />
      <JapanWatermark />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/display/gate" element={<GateDisplay />} />
          <Route path="/display/:platformId" element={<SignageBoard />} />
        </Routes>
      </div>
    </div>
  )
}
