import { useState } from 'react'
import Navbar from './components/Navbar'
import MazeCanvas from './components/MazeCanvas'
import StatusPanel from './components/StatusPanel'

export default function App() {
  const [faseAtual, setFaseAtual] = useState('labirinto01')

  return (
    <div style={{ backgroundColor: '#0f1117', height: '100vh', display: 'flex', flexDirection: 'column', color: 'white' }}>
      <Navbar faseAtual={faseAtual} onFaseChange={setFaseAtual} />
      
      <main style={{ display: 'flex', flex: 1, gap: '1rem', padding: '1rem' }}>
        <div style={{ flex: 1, backgroundColor: '#1a1d2e', borderRadius: '12px', padding: '1rem' }}>
          <MazeCanvas />
        </div>
        <div style={{ width: '288px', backgroundColor: '#1a1d2e', borderRadius: '12px', padding: '1rem' }}>
          <StatusPanel />
        </div>
      </main>

      <footer style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', padding: '8px' }}>
        MicroMouse
      </footer>
    </div>
  )
}