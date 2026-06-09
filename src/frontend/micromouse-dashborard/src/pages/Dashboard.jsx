import {useState, useEffect, useRef} from 'react'
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
    const [posicao, setPosicao] = useState({x: 0, y: 0})
    const [celulasVisitadas, setCelulasVisitadas] = useState(0)
    const inicioRef = useRef(null)
    const [rastro, setRastro] = useState([])
    const [passoAtual, setPassoAtual] = useState(0)


    useEffect(() => {
        let ws = null
        let tentativas = 0

        const conectar = () => {
            ws = new WebSocket('ws://127.0.0.1:8000/ws/corrida/live/')

            ws.onopen = () => {
                console.log('Conectado ao WebSocket!')
                tentativas = 0
            }

            ws.onmessage = (evento) => {
                console.log('mensagem recebida:', JSON.parse(evento.data))
                const data = JSON.parse(evento.data)

                setPosicao({x: data.x, y: data.y})
                setDirecao(data.direcao)
                setVelocidade(data.velocidade)
                setBateria(data.bateria)
                setCelulasVisitadas(data.posicao_ordem)
                setGrid(prev => ({...prev, [`${data.celula.linha},${data.celula.coluna}`]: data.celula}))
                setRastro(prev => [...prev, {x: data.x, y: data.y, direcao: data.direcao}])
            }

            ws.onclose = () => {
                console.log('WebSocket fechado, tentando reconectar...')
                tentativas++
                setTimeout(conectar, 2000) // tenta de novo após 2 segundos
            }

            ws.onerror = () => {
                ws.close()
            }
        }

        conectar()

        return () => {
            if (ws) ws.close()
        }
    }, [])

    // tempo cronometro
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
                    <MazeCanvas fase={faseAtual} grid={grid} setGrid={setGrid} mouseX={posicao.x} mouseY={posicao.y}
                                setRastro={setRastro} rastro={rastro}/>
                    {/* passo a variavel faseAtual pra dentro de Maze canvas */}
                </div>
                <div style={{width: '288px', backgroundColor: '#1a1d2e', borderRadius: '12px', padding: '1rem'}}>
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
                        }}/>
                </div>
            </main>
            <button onClick={() => {
                if (passoAtual < chaves.length) {
                    const chave = chaves[passoAtual] // quando o WB estiver pronto substituir pela a adaptação do WB
                    const celula = celulasMock[chave]
                    setGrid(prev => ({...prev, [chave]: celulasMock[chave]}))
                    setPosicao({x: celula.coluna, y: celula.linha})
                    setRastro(r => [...r, {x: posicao.x, y: posicao.y, direcao: direcao}])
                    setPassoAtual(p => p + 1)
                }
            }}>
                Mover ratinho →
            </button>
            <footer style={{textAlign: 'center', fontSize: '12px', color: '#6b7280', padding: '8px'}}>
                MicroMouse
            </footer>
        </div>
    )
}