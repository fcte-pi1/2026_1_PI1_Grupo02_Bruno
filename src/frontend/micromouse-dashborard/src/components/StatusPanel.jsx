import Cronometro from "./Cronometro";
import MetriCard from "./MetriCard";
import {useNavigate} from "react-router-dom";

export default function StatusPanel({
                                        posicao, onPosicao, direcao, onDirecao, celulas, onCelulas,
                                        onToggle,
                                        rodando,
                                        onRodando,
                                        tempo,
                                        onTempo,
                                        bateria,
                                        onBateria,
                                        velocidade,
                                        onVelocidade

                                    }) {

    const Bateria = 'Bateria'
    // console.log(bateria)
    const navigate = useNavigate()
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '14px', height: '100%'}}>
            <div id='estado'
                 style={{fontSize: '11px', color: '#6b7280', letterSpacing: '1px', marginBottom: '0 0 8px 0'}}>
                <div id={'card'} style={{

                    backgroundColor: '#11131f',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <p style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        letterSpacing: '1px',
                        margin: '0 0 8px 0'
                    }}>Estado:</p>
                    <div id={'bolinha'} style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: rodando ? '#22c55e' : '#6b7280',
                        flexShrink: 0
                    }}/>
                    <div id={'texto-estado'}
                    >
                        <p style={{
                            margin: '0',
                            fontSize: '12px'
                        }}>{rodando ? 'Em execução' : 'Parado, aguardando Início'}</p>
                    </div>
                </div>
            </div>
            <div id='cronometro'>
                <Cronometro tempo={tempo} onTempo={onTempo}
                            onToglle={onToggle} rodando={rodando}/>
            </div>
            <div id='metricas'>
                {<MetriCard titulo={Bateria} valor={bateria} onValor={onBateria} unidade={'%'} showBarra={true}/>}

            </div>
            <div id='metricas2' style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                {<MetriCard quadrado={true} titulo={'velocidade Média'} valor={velocidade} onValor={onVelocidade}
                            unidade={'m/s'}/>}
                {<MetriCard quadrado={true} titulo={'Direção'} valor={direcao} onValor={onDirecao}/>}
                <MetriCard quadrado={true} titulo={'Posição Atual'} valor={`${posicao.x}, ${posicao.y}`}
                           onValor={onPosicao}/>
                <MetriCard quadrado={true} titulo={'N° de  Células visitadas'} valor={celulas} onValor={onCelulas}/>
            </div>
            <div id='historico'>
                <button style={{
                    width: '100%',
                    backgroundColor: '#2e3347',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#f3f4f6',
                    fontSize: '15px',
                    border: 'none',
                    cursor: 'pointer'
                }} onClick={()=>{
                    navigate('/historico')
                }}>Historico
                </button>
            </div>

        </div>
    )
}