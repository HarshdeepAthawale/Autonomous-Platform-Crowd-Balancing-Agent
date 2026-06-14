import { Routes, Route } from 'react-router-dom'
import Dashboard    from './pages/Dashboard'
import SignageBoard from './pages/SignageBoard'
import GateDisplay  from './pages/GateDisplay'
import './index.css'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4EEE3', position: 'relative' }}>
      <div className="washi-grain" />
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
