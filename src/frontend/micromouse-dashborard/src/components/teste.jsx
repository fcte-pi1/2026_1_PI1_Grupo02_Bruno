import { useEffect, useState } from "react"

export default function Teste() {
    const corridaId = 1
    const [telemetria, setTelemetria] = useState(null)

    useEffect(() => {
        const ws = new WebSocket("ws://127.0.0.1:8000/ws/corrida/live/")

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("telemetria:", data)
            setTelemetria(data)
        }

        ws.onclose = () => console.log("websocket fechado")
        ws.onerror = (error) => console.error("erro de conexão:", error)

        return () => ws.close()
    }, [corridaId])

    return (
        <div style={{ padding: "20px" }}>
            <h1>Telemetria da Corrida {corridaId}</h1>

            {!telemetria ? (
                <p>Aguardando dados...</p>
            ) : (
                <>
                    <h2>Dados recebidos</h2>

                    <ul>
                        <li><strong>Linha:</strong> {telemetria.linha}</li>
                        <li><strong>Coluna:</strong> {telemetria.coluna}</li>
                        <li><strong>X:</strong> {telemetria.x}</li>
                        <li><strong>Y:</strong> {telemetria.y}</li>
                        <li><strong>Direção:</strong> {telemetria.direcao}</li>
                        <li><strong>Velocidade:</strong> {telemetria.velocidade}</li>
                        <li><strong>Bateria:</strong> {telemetria.bateria}%</li>
                        <li><strong>Posição Ordem:</strong> {telemetria.posicao_ordem}</li>
                        <li><strong>Parede Norte:</strong> {String(telemetria.parede_norte)}</li>
                        <li><strong>Parede Sul:</strong> {String(telemetria.parede_sul)}</li>
                        <li><strong>Parede Leste:</strong> {String(telemetria.parede_leste)}</li>
                        <li><strong>Parede Oeste:</strong> {String(telemetria.parede_oeste)}</li>
                    </ul>

                    <h2>JSON Completo</h2>

                    <pre
                        style={{
                            background: "#f4f4f4",
                            padding: "10px",
                            borderRadius: "8px",
                            overflowX: "auto",
                        }}
                    >
                        {JSON.stringify(telemetria, null, 2)}
                    </pre>
                </>
            )}
        </div>
    )
}