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
            <h1>Telemetria da Corrida:</h1>

            {!telemetria ? (
                <p>Aguardando dados...</p>
            ) : (
                <>
                    <h2>Dados recebidos da corrida {telemetria.corrida_id}</h2>

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