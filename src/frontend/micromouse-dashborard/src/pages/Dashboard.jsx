import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar.jsx'
import MazeCanvas from '../components/MazeCanvas'
import StatusPanel from '../components/StatusPanel'

export default function Dashboard() {
    const [grid, setGrid] = useState({})
    const [faseAtual, setFaseAtual] = useState('Labirinto 01')
    const [rodando, setRodando] = useState(false)
    const [tempo, setTempo] = useState(0)
    const [bateria, setBateria] = useState(100)
    const [velocidade, setVelocidade] = useState(5)
    const [direcao, setDirecao] = useState('Norte')
    const [posicao, setPosicao] = useState({ x: 0, y: 0 })
    const [celulasVisitadas, setCelulasVisitadas] = useState(0)
    const [rastro, setRastro] = useState([])
    const wsRef = useRef(null)
    const [conectado, setConectado] = useState(false)
    const [dimensaoLabirinto, setDimensaoLabirinto] = useState(4)
    const celulasVisitadasRef = useRef(new Set())

    const calcularDirecaoMovimento = (origem, destino) => {
        const deltaX = destino.x - origem.x
        const deltaY = destino.y - origem.y

        if (deltaX > 0) return 'Leste'
        if (deltaX < 0) return 'Oeste'
        if (deltaY > 0) return 'Norte'
        if (deltaY < 0) return 'Sul'

        return origem.direcao
    }

    const conectar = () => {
        wsRef.current = new WebSocket('ws://127.0.0.1:8000/ws/corrida/live/')

        wsRef.current.onopen = () => {
            setConectado(true)
            console.log('Conectado!')
        }

        wsRef.current.onmessage = (evento) => {
            const mensagem = JSON.parse(evento.data)
            const { tipo, payload, timestamp_ms } = mensagem

            if (tipo === "run_started") {
                setRodando(true)
                setBateria(payload.bateria)
                setTempo(0)
                setDimensaoLabirinto(payload.dimensao)
                setGrid({})
                setRastro([])
                setPosicao({ x: 0, y: 0 })
                setCelulasVisitadas(0)
                celulasVisitadasRef.current = new Set()

            }

            if (tipo === "cell_discovered") {
                setTempo(timestamp_ms)
                setPosicao({ x: payload.x, y: payload.y })
                setDirecao(payload.direcao)
                setVelocidade(payload.velocidade)
                setBateria(payload.bateria)

                setGrid(prev => ({
                    ...prev,
                    [`${payload.linha},${payload.coluna}`]: payload
                }))
                const chave = `${payload.linha},${payload.coluna}`
                if (!celulasVisitadasRef.current.has(chave)) {
                    celulasVisitadasRef.current.add(chave)
                    setCelulasVisitadas(celulasVisitadasRef.current.size)
                }
                setRastro(prev => {
                    const jaVisitada = prev.some(item => item.x === payload.x && item.y === payload.y)
                    if (jaVisitada) return prev

                    const novoRastro = [...prev]
                    const ultima = novoRastro[novoRastro.length - 1]
                    if (!ultima || ultima.x !== payload.x || ultima.y !== payload.y) {
                        if (ultima) {
                            ultima.direcao = calcularDirecaoMovimento(ultima, payload)
                        }
                        novoRastro.push({ x: payload.x, y: payload.y, direcao: null })
                    }



                    return novoRastro
                })
            }

            if (tipo === 'run_finished') {
                // corrida finalizada
                setRodando(false)
                setVelocidade(payload.v_med)
                setBateria(payload.bateria)
            }
        }

        wsRef.current.onclose = () => {
            setConectado(false)
            console.log('WebSocket fechado')
            setTimeout(conectar, 2000)
        }

        wsRef.current.onerror = () => {
            wsRef.current.close()
        }
    }


    useEffect(() => {
        if (!rodando) return

        const intervalo = setInterval(() => {
            setTempo(t => t + 10)
        }, 10)

        return () => clearInterval(intervalo)
    }, [rodando])

    useEffect(() => {
        conectar()
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, []);


    // tempo cronometro

    return (
        <div style={{
            backgroundColor: '#0f1117',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            color: 'white'
        }}>
            <Navbar faseAtual={faseAtual} onFaseChange={setFaseAtual} />

            <main style={{ display: 'flex', flex: 1, minHeight: 0, gap: '0.75rem', padding: '0.75rem' }}>
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    backgroundColor: '#1a1d2e',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <MazeCanvas fase={faseAtual} grid={grid} setGrid={setGrid} mouseX={posicao.x} mouseY={posicao.y}
                        setRastro={setRastro} rastro={rastro}
                        tamanhoGrid={dimensaoLabirinto} />
                    {/* passo a variavel faseAtual pra dentro de Maze canvas */}
                </div>
                <div style={{ width: '288px', backgroundColor: '#1a1d2e', borderRadius: '12px', padding: '1rem' }}>
                    <StatusPanel
                        celulas={celulasVisitadas} onCelulas={setCelulasVisitadas}
                        posicao={posicao} onPosicao={setPosicao}
                        direcao={direcao} onDirecao={setDirecao}
                        rodando={rodando} onRodando={setRodando}
                        tempo={tempo} onTempo={setTempo}
                        bateria={bateria} onBateria={setBateria}
                        velocidade={velocidade} onVelocidade={setVelocidade}
                        onToggle={() => {
                            setRodando(r => !r)
                        }} />
                </div>
            </main>
            {/*<button onClick={conectar}>*/}
            {/*    {conectado ? '🟢 Conectado' : '⚪ Conectar'}*/}
            {/*</button>*/}

            <footer style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', padding: '8px' }}>
                MicroMouse
            </footer>
        </div>
    )
}
