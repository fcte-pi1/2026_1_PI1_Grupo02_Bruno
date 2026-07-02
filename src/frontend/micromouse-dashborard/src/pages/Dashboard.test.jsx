import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {render, screen, act} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import Dashboard from './Dashboard'
import {MockWebSocket} from '../test/mockWebSocket'

// Mensagem de telemetria no formato enviado pelo backend.
const telemetria = {
    x: 2,
    y: 3,
    direcao: 'Leste',
    velocidade: 4,
    bateria: 75,
    posicao_ordem: 7,
    celula: {linha: 3, coluna: 2, parede_norte: true, parede_leste: false, parede_oeste: false, parede_sul: false},
}

function renderDashboard() {
    return render(
        <MemoryRouter>
            <Dashboard/>
        </MemoryRouter>,
    )
}

// Testes de integração do painel principal (Dashboard).
// Cobre CT-SW-01 (telemetria em tempo real), CT-SW-04 (posição),
// CT-SW-06 (estado operacional) e CT-SW-02 (reconexão automática).
describe('Dashboard (integração de telemetria)', () => {
    beforeEach(() => {
        MockWebSocket.limpar()
        vi.stubGlobal('WebSocket', MockWebSocket)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it('abre uma conexão WebSocket com o endpoint de corrida ao vivo', () => {
        renderDashboard()

        const ws = MockWebSocket.ultima()
        expect(ws).toBeDefined()
        expect(ws.url).toBe('ws://127.0.0.1:8000/ws/corrida/live/')
    })

    it('atualiza posição, bateria, velocidade, direção e células ao receber telemetria', async () => {
        renderDashboard()

        // Estado inicial: parado, aguardando início.
        expect(screen.getByText('Parado, aguardando Início')).toBeInTheDocument()

        await act(async () => {
            MockWebSocket.ultima().emitirMensagem(telemetria)
        })

        expect(screen.getByText('75')).toBeInTheDocument() // bateria
        expect(screen.getByText('4')).toBeInTheDocument() // velocidade
        expect(screen.getByText('Leste')).toBeInTheDocument() // direção
        expect(screen.getByText('2, 3')).toBeInTheDocument() // posição x, y
        expect(screen.getByText('7')).toBeInTheDocument() // células visitadas
    })

    it('tenta reconectar automaticamente após o fechamento da conexão', async () => {
        vi.useFakeTimers()
        renderDashboard()

        expect(MockWebSocket.instances).toHaveLength(1)

        // Simula a queda da conexão.
        await act(async () => {
            MockWebSocket.ultima().close()
        })

        // Após 2 segundos, uma nova conexão deve ser criada.
        await act(async () => {
            vi.advanceTimersByTime(2000)
        })

        expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2)
    })
})
