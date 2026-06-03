export default function MetriCard(valor, titulo, unidade, maximo, showBarra) {
const corBarra = valor.valor > 50 ? '#22c55e' : valor > 20 ? '#facc15' : '#ef4444'
    return (
        <div id={'card-container'} style={{backgroundColor: '#11131f', borderRadius: '10px', padding: '8px 16px'}}>

            <p style={{fontSize: '11px', color: '#6b7280', letterSpacing: '1px', }}>{'Bateria'}</p>
            <div id={'valorAndUnidade'} style={{
                display: 'flex', alignItems: 'baseline', gap: '4px'
            }}>
                <p style={{fontSize: '22px', color: '#00e5ff', }}>{valor.valor}</p>
                <p style={{fontSize: '12px', color: '#00e5ff',}}>{valor.unidade}</p>
            </div>
            <div style={{backgroundColor: corBarra, borderRadius: '999px', height: '4px', marginTop: '8px'}}>
                {showBarra && <div style={{
                    backgroundColor:  corBarra, borderRadius: '999px', height: '4px',
                    width: `${valor}%`
                }}>

                </div>}
            </div>
        </div>
    )
}