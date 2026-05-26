import {useState, useEffect, useRef} from 'react'
import Navbar from './components/Navbar'
import MazeCanvas from './components/MazeCanvas'
import StatusPanel from './components/StatusPanel'

export default function App() {
    const [faseAtual, setFaseAtual] = useState('Labirinto 01')
    const [rodando, setRodando] = useState(false)
    const [tempo, setTempo] = useState(0)
    const [bateria, setBateria] = useState(100)
    const [velocidade, setVelocidade] = useState(0)
    const inicioRef = useRef(null)

    useEffect(() => {
        if (!rodando) return

        // zera o tempo e marca denovo o inicio do cronometro

        inicioRef.current = Date.now()
        const intervalo = setInterval(() => {
            setTempo(tempo => tempo + 10) // põe 10 milisegundo no tempo
        }, 10) // a cada 10 milisegundo

        return () => clearInterval(intervalo)// limpa o intervalo quando o componente for desmontado

    }, [rodando])

    return (
        <div style={{
            backgroundColor: '#0f1117',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            color: 'white'
        }}>
            <Navbar faseAtual={faseAtual} onFaseChange={setFaseAtual}/>

            <main style={{display: 'flex', flex: 1, gap: '1rem', padding: '1rem'}}>
                <div style={{flex: 1, backgroundColor: '#1a1d2e', borderRadius: '12px', padding: '1rem'}}>
                    <MazeCanvas fase={faseAtual}/>
                    {/* passo a variavel faseAtual pra dentro de Maze canvas */}
                </div>
                <div style={{width: '288px', backgroundColor: '#1a1d2e', borderRadius: '12px', padding: '1rem'}}>
                    <StatusPanel

                        rodando={rodando} onRodando={setRodando}
                        tempo={tempo} onTempo={setTempo}
                        bateria={bateria} onBateria={setBateria}
                        velocidade={velocidade} onVelocidade={setVelocidade}
                        onToggle={() => {
                            setRodando(r => !r)
                        }}/>
                </div>
            </main>

            <footer style={{textAlign: 'center', fontSize: '12px', color: '#6b7280', padding: '8px'}}>
                MicroMouse
            </footer>
        </div>
    )
}