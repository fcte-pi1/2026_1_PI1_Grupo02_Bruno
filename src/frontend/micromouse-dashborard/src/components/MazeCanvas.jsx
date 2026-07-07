import {useEffect, useRef, useState} from "react";


const fases = {
    'Labirinto 01': {id: 'labirinto01', label: 'Labirinto 4x4', cor: 'bg-purple-500', tipo: '4 x 4'},
    'Labirinto 02': {id: 'labirinto02', label: 'Labirinto 8x8', cor: 'bg-pink-500', tipo: '8 x 8'},
    'Labirinto 03': {id: 'labirinto03', label: 'Labirinto 16x16', cor: 'bg-green-500', tipo: '16 x 16'},
    'Desafio': {id: 'Desafio', label: 'Desafio final', cor: 'bg-blue-500'},
}
const legenda = [
    {cor: '#ef4444', label: 'Mouse'},
    {cor: '#60a5fa', label: 'Trajeto'},
    {cor: '#94a3b8', label: 'Parede'},
    {cor: '#facc15', label: 'Destino'},
]

function temParede(valor) {
    if (valor === true || valor === 1) return true
    if (typeof valor !== 'string') return false

    const normalizado = valor.trim().toLowerCase()
    return normalizado === 'parede' || normalizado === 'true' || normalizado === '1'
}

function anguloDirecao(direcao) {
    const direcaoNormalizada = String(direcao ?? '').trim().toLowerCase()
    const angulos = {
        n: -Math.PI / 2,
        norte: -Math.PI / 2,
        s: Math.PI / 2,
        sul: Math.PI / 2,
        l: 0,
        leste: 0,
        o: Math.PI,
        oeste: Math.PI,
    }

    return angulos[direcaoNormalizada] ?? 0
}

export default function MazeCanvas({tamanhoGrid, fase, grid, setGrid, setRastro, mouseX, mouseY, rastro}) {
    const fase_atual = fases[fase] ?? fases['Labirinto 01']
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const [canvasSize, setCanvasSize] = useState({width: 600, height: 600})

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const atualizarTamanho = () => {
            const {width, height} = container.getBoundingClientRect()
            setCanvasSize({
                width: Math.max(1, Math.floor(width)),
                height: Math.max(1, Math.floor(height)),
            })
        }

        atualizarTamanho()

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', atualizarTamanho)
            return () => window.removeEventListener('resize', atualizarTamanho)
        }

        const observer = new ResizeObserver(atualizarTamanho)
        observer.observe(container)

        return () => observer.disconnect()
    }, [])

    useEffect(() => {

            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            const dimensao = Number(tamanhoGrid) || 4
            const areaDesenho = Math.min(canvas.width, canvas.height)
            const offsetX = (canvas.width - areaDesenho) / 2
            const offsetY = (canvas.height - areaDesenho) / 2
            const tamanho = areaDesenho / dimensao// tamanho de cada celula em pixeis

            ctx.clearRect(0, 0, canvas.width, canvas.height)// limpa a celula
            Object.values(grid).forEach((celula) => {
                const x = offsetX + celula.coluna * tamanho
                const y = offsetY + (dimensao - 1 - celula.linha) * tamanho
                // 'aloca cada celula no grid'

                // fundo da celula
                ctx.fillStyle = '#11131f'
                ctx.fillRect(x, y, tamanho, tamanho) // desenha a celula dela no lugar dela

                // linhas
                ctx.strokeStyle = '#94a3b8'
                ctx.lineWidth = 2

                // desenha parede
                if (temParede(celula.parede_norte)) {
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + tamanho, y)
                    ctx.stroke()
                }
                if (temParede(celula.parede_leste)) {
                    ctx.beginPath()
                    ctx.moveTo(x + tamanho, y)
                    ctx.lineTo(x + tamanho, y + tamanho)
                    ctx.stroke()
                }
                if (temParede(celula.parede_oeste)) {
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x, y + tamanho)
                    ctx.stroke()
                }
                if (temParede(celula.parede_sul)) {
                    ctx.beginPath()
                    ctx.moveTo(x, y + tamanho)
                    ctx.lineTo(x + tamanho, y + tamanho)
                    ctx.stroke()
                }


            }) // roda toda vez que o grid mudar

            const mX = offsetX + mouseX * tamanho + tamanho / 2
            const mY = offsetY + (dimensao - 1 - mouseY) * tamanho + tamanho / 2

            // console.log('mouseX:', mouseX)
            // console.log('mouseY:', mouseY)
            // console.log('mX:', mX)
            // console.log('mY:', mY)

            ctx.beginPath()
            ctx.arc(mX, mY, tamanho / 6, 0, Math.PI * 2)// desenho o criculo do ratinho
            ctx.fillStyle = '#ef4444'// vermelho
            ctx.fill()

            rastro.forEach(({x, y, direcao}) => {
                if (!direcao) return

                const xR = offsetX + x * tamanho + tamanho / 2
                const yR = offsetY + (dimensao - 1 - y) * tamanho + tamanho / 2
                const angulo = anguloDirecao(direcao)

                ctx.save()
                ctx.translate(xR, yR)
                ctx.rotate(angulo)

                // desenha da sceta
                ctx.beginPath()
                ctx.moveTo(-8, 0)
                ctx.lineTo(8, 0)
                ctx.lineTo(4, -4)
                ctx.moveTo(8, 0)
                ctx.lineTo(4, 4)
                ctx.strokeStyle = '#60a5fa'
                ctx.lineWidth = 2
                ctx.stroke()

                ctx.restore()
            })
        }, [grid, mouseX, mouseY, rastro, tamanhoGrid, canvasSize]
    )
    return (
        <div id='maze-complete' style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: 'flex',
            height: '100%',
            maxHeight: 'calc(100vh - 150px)',
            gap: '8px'
        }}>
            <div id="maze-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                    <p style={{margin: '0', fontSize: '13px', color: '#9ca3af'}}>Fase atual:</p>
                    <h2 style={{
                        margin: '0',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>{`${tamanhoGrid}x${tamanhoGrid}`}</h2>
                </div>
                <span style={{
                    backgroundColor: '#2e3347',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    color: '#9ca3af'


                }}>{fase_atual.tipo}</span>
            </div>
            <div ref={containerRef} id="maze-canvas" style={{
                flex: '0 1 auto',
                position: 'relative',
                width: 'min(100%, 52vh)',
                maxWidth: '440px',
                aspectRatio: '1 / 1',
                alignSelf: 'center'
            }}>

                <canvas
                    ref={canvasRef}
                    id="maze-canvas"
                    height={canvasSize.height}
                    width={canvasSize.width}
                    style={{borderRadius: '10px', width: '100%', height: '100%', display: 'block'}}
                />
            </div>
            <div id={'legenda'} style={{display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap'}}>
                {legenda.map((item) => (
                    <div key={item.label} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#9ca3af'
                    }}>
                        <span style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.cor}}/>
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    )
}





