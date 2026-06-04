export default function MetriCard({valor, titulo, unidade, maximo, showBarra, quadrado}) {
    const corBarra = valor > 50 ? '#22c55e' : valor > 20 ? '#facc15' : '#ef4444'
    return (

        <div id={'card-container'} style={{backgroundColor: '#11131f', borderRadius: '10px', padding: '8px 16px', height: quadrado ? '90px' : 'auto'}}>

            <p style={{fontSize: '11px', color: '#6b7280', letterSpacing: '1px',}}>{titulo}</p>
            <div id={'valorAndUnidade'} style={{
                display: 'flex', alignItems: 'baseline', gap: '4px'
            }}>
                <p style={{fontSize: '22px', color: '#00e5ff',}}>{valor}</p>
                <p style={{fontSize: '12px', color: '#00e5ff',}}>{unidade}</p>
            </div>
            {showBarra && (
                <div style={{backgroundColor: '#2e3347', borderRadius: '999px', height: '4px'}}>
                    <div style={{
                        backgroundColor: corBarra,
                        width: `${(valor / maximo) * 100}%`,
                        height: '4px',
                        borderRadius: '999px'
                    }}/>
                </div>
            )}
        </div>
    )
}