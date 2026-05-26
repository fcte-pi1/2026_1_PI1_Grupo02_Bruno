const fases = {
    'Labirinto 01': {id: 'labirinto01', label: 'Labirinto 01', cor: 'bg-purple-500', tipo: '4 x 4'},
    'Labirinto 02': {id: 'labirinto02', label: 'Labirinto 02', cor: 'bg-pink-500', tipo: '8 x 8'},
    'Labirinto 03': {id: 'labirinto03', label: 'Labirinto 03', cor: 'bg-green-500', tipo: '16 x 16'},
    'Desafio': {id: 'Desafio', label: 'Desafio final', cor: 'bg-blue-500'},
}
const legenda = [
    {cor: 'bg-red-500', label: 'Mouse'},
    {cor: 'bg-blue-400', label: 'Trajeto'},
    {cor: 'bg-slate-400', label: 'Parede'},
    {cor: 'bg-yellow-400', label: 'Destino'}
]

export default function MazeCanvas({fase}) {
    console.log(fase)

    const fase_atual = fases[fase]
    console.log(fase_atual)
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
                {legenda.map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9ca3af' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.cor.replace('bg-', '') }} />
                            {item.label}
                    </div>
                ))}
            </div>
        </div>
    )
}





