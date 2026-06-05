import { useEffect, useState } from "react"

export default function Teste() {
    const corridaId = 1
    const [telemetria, setTelemetria] = useState(null)

    useEffect(() => {
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/corrida/${corridaId}/live/`)

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("telemetria: ", data)
            setTelemetria(data)
        }

        ws.onclose = () => console.log("websocket fechado")
        ws.onerror = (error) => console.error("erro de conexao: ", error)

        // fecha a conexão quando o componente desmonta
        return () => ws.close()
    }, [corridaId]) // só reconecta se corridaId mudar

    return (
        <div>
            <h1>Telemetria da Corrida: {corridaId}</h1>
            {telemetria && (
                <p>Posição: ({telemetria.x}, {telemetria.y}) | Direção: {telemetria.direcao}</p>
            )}
        </div>
    )
}