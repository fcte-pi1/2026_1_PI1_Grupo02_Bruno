// Utilitários compartilhados pelas suítes E2E.

// Intercepta o WebSocket de telemetria e envia as mensagens informadas para a
// interface, simulando o backend durante uma corrida ao vivo.
export async function mockarTelemetria(page, mensagens) {
    await page.routeWebSocket(/corrida\/live/, (ws) => {
        for (const mensagem of mensagens) {
            ws.send(JSON.stringify(mensagem))
        }
    })
}

// Mensagem de telemetria padrão no formato emitido pelo backend.
export function telemetria(sobrescritas = {}) {
    return {
        x: 2,
        y: 3,
        direcao: 'Leste',
        velocidade: 4,
        bateria: 75,
        posicao_ordem: 7,
        celula: {
            linha: 3,
            coluna: 2,
            parede_norte: true,
            parede_leste: false,
            parede_oeste: false,
            parede_sul: false,
        },
        ...sobrescritas,
    }
}
