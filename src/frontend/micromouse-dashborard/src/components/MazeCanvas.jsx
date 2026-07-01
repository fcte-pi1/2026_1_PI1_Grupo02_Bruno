import {useEffect, useRef} from "react";


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

export default function MazeCanvas({tamanhoGrid, fase, grid, setGrid, setRastro, mouseX, mouseY, rastro}) {
    const fase_atual = fases[fase]
    const canvasRef = useRef(null)


    useEffect(() => {

            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            const tamanho = Math.min(canvas.width, canvas.height) / tamanhoGrid// tamanho de cada celula em pixeis

            ctx.clearRect(0, 0, canvas.width, canvas.height)// limpa a celula
            Object.values(grid).forEach((celula) => {
                const x = celula.coluna * tamanho
                const y = (tamanhoGrid - 1 - celula.linha) * tamanho
                // 'aloca cada celula no grid'

                // fundo da celula
                ctx.fillStyle = '#11131f'
                ctx.fillRect(x, y, tamanho, tamanho) // desenha a celula dela no lugar dela

                // linhas
                ctx.strokeStyle = '#94a3b8'
                ctx.lineWidth = 2

                // desenha parede
                if (celula.parede_norte == true) {
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + tamanho, y)
                    ctx.stroke()
                }
                if (celula.parede_leste === true) {
                    ctx.beginPath()
                    ctx.moveTo(x + tamanho, y)
                    ctx.lineTo(x + tamanho, y + tamanho)
                    ctx.stroke()
                }
                if (celula.parede_oeste === true) {
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x, y + tamanho)
                    ctx.stroke()
                }
                if (celula.parede_sul === true) {
                    ctx.beginPath()
                    ctx.moveTo(x, y + tamanho)
                    ctx.lineTo(x + tamanho, y + tamanho)
                    ctx.stroke()
                }


            }) // roda toda vez que o grid mudar

            const mX = mouseX * tamanho + tamanho / 2
            const mY = (tamanhoGrid - 1 - mouseY) * tamanho + tamanho / 2

            // console.log('mouseX:', mouseX)
            // console.log('mouseY:', mouseY)
            // console.log('mX:', mX)
            // console.log('mY:', mY)

            ctx.beginPath()
            ctx.arc(mX, mY, tamanho / 3, 0, Math.PI * 2)// desenho o criculo do ratinho
            ctx.fillStyle = '#ef4444'// vermelho
            ctx.fill()
            console.log(rastro)

            rastro.forEach(({x, y, direcao}) => {
                if (!direcao) return

                const xR = x * tamanho + tamanho / 2
                const yR = (tamanhoGrid - 1 - y) * tamanho + tamanho / 2

                const angulos = {
                    'N': -Math.PI / 2,
                    'S': Math.PI / 2,
                    'L': 0,
                    'O': Math.PI
                }

                const angulo = angulos[direcao] ?? 0

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
        }, [grid, mouseX, mouseY, rastro]
    )
    return (
        <div id='maze-complete' style={{display: 'flex', flexDirection: 'column', height: '100%', gap: '12px'}}>
            <div id="maze-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                    <p style={{margin: '0', fontSize: '15px', color: '#9ca3af'}}>Fase atual:</p>
                    <h2 style={{
                        margin: '0',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>{fase_atual.label || 'Labirinto 01'}</h2>
                </div>
                <span style={{
                    backgroundColor: '#2e3347',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    color: '#9ca3af'


                }}>{fase_atual.tipo}</span>
            </div>
            <div id="maze-canvas" style={{flex: 1, position: 'relative'}}>

                <canvas ref={canvasRef} id="maze-canvas" height='100%' width='100%'
                        style={{borderRadius: '10px'}}/>
            </div>
            <div id={'legenda'} style={{display: 'flex', gap: '12px', marginTop: '12px'}}>
                {legenda.map((item) => (
                    <div key={item.label} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
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





