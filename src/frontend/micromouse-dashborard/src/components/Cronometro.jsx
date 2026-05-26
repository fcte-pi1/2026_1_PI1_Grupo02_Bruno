// metodo Sring.padStart()
// "abc".padStart(5, "."); ->  Output: "..abc"
export default function Cronometro({tempo = 0, onTempo, onToglle, rodando}) {
    const minutos = String(Math.floor(tempo / 60000))
    const segundos = String(Math.floor((tempo % 60000) / 1000))
    const milisegundos = String(Math.floor(tempo % 1000))

    return (
        <div id='cronometro-container' style={{
            backgroundColor: '#11131f',
            borderRadius: '10px',
            padding: '16px',
        }}>
            <p style={{
                fontSize: '15px',
                color: '#6b7280',
                letterSpacing: '1px',
                margin: '0 0 8px 0'
            }}>Cronômetro: </p>
            <div id={'timer'}>
                <span style={{
                    fontSize: '48px',
                    color: '#00e5ff'
                }}>{`${minutos.padStart(2, '0')}:${segundos.padStart(2, '0')}.`}</span>
                <span style={{fontSize: '24px', color: '#00e5ff'}}>{`${milisegundos.padStart(3, '0')}`}</span>
            </div>
            <button id={'iniciar'} onClick={()=>{
                if(!rodando) onTempo(0)
                onToglle()
            }}>
                {rodando ? 'Parar' : 'Iniciar'}
            </button>
        </div>
    )
}