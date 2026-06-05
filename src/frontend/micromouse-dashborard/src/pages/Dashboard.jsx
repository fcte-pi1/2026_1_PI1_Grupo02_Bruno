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

    const celulasMock = {
        '0,0': {
            linha: 0,
            coluna: 0,
            parede_norte: 'parede',
            parede_sul: 'livre',
            parede_leste: 'livre',
            parede_oeste: 'parede'
        },
        '0,1': {
            linha: 0,
            coluna: 1,
            parede_norte: 'parede',
            parede_sul: 'parede',
            parede_leste: 'livre',
            parede_oeste: 'livre'
        },
        '0,2': {
            linha: 0,
            coluna: 2,
            parede_norte: 'parede',
            parede_sul: 'livre',
            parede_leste: 'livre',
            parede_oeste: 'livre'
        },
        '0,3': {
            linha: 0,
            coluna: 3,
            parede_norte: 'parede',
            parede_sul: 'livre',
            parede_leste: 'parede',
            parede_oeste: 'livre'
        },

        '1,0': {
            linha: 1,
            coluna: 0,
            parede_norte: 'livre',
            parede_sul: 'livre',
            parede_leste: 'parede',
            parede_oeste: 'parede'
        },
        '1,1': {
            linha: 1,
            coluna: 1,
            parede_norte: 'parede',
            parede_sul: 'livre',
            parede_leste: 'livre',
            parede_oeste: 'parede'
        },
        '1,2': {
            linha: 1,
            coluna: 2,
            parede_norte: 'livre',
            parede_sul: 'parede',
            parede_leste: 'parede',
            parede_oeste: 'livre'
        },
        '1,3': {
            linha: 1,
            coluna: 3,
            parede_norte: 'livre',
            parede_sul: 'livre',
            parede_leste: 'parede',
            parede_oeste: 'parede'
        },

        '2,0': {
            linha: 2,
            coluna: 0,
            parede_norte: 'livre',
            parede_sul: 'parede',
            parede_leste: 'livre',
            parede_oeste: 'parede'
        },
        '2,1': {
            linha: 2,
            coluna: 1,
            parede_norte: 'livre',
            parede_sul: 'livre',
            parede_leste: 'parede',
            parede_oeste: 'livre'
        },
        '2,2': {
            linha: 2,
            coluna: 2,
            parede_norte: 'parede',
            parede_sul: 'livre',
            parede_leste: 'livre',
            parede_oeste: 'parede'
        },
        '2,3': {
            linha: 2,
            coluna: 3,
            parede_norte: 'livre',
            parede_sul: 'parede',
            parede_leste: 'parede',
            parede_oeste: 'livre'
        },

        '3,0': {
            linha: 3,
            coluna: 0,
            parede_norte: 'parede',
            parede_sul: 'parede',
            parede_leste: 'livre',
            parede_oeste: 'parede'
        },
        '3,1': {
            linha: 3,
            coluna: 1,
            parede_norte: 'livre',
            parede_sul: 'parede',
            parede_leste: 'livre',
            parede_oeste: 'livre'
        },
        '3,2': {
            linha: 3,
            coluna: 2,
            parede_norte: 'livre',
            parede_sul: 'parede',
            parede_leste: 'parede',
            parede_oeste: 'livre'
        },
        '3,3': {
            linha: 3,
            coluna: 3,
            parede_norte: 'parede',
            parede_sul: 'parede',
            parede_leste: 'parede',
            parede_oeste: 'parede'
        },
    }
    const chaves = Object.keys(celulasMock)

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