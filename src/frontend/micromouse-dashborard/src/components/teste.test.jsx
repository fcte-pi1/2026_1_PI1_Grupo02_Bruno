import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {render, screen, act} from '@testing-library/react'
import Teste from './teste'
import {MockWebSocket} from '../test/mockWebSocket'

// Testes da página de telemetria bruta (rota /testes).
describe('Teste (telemetria bruta)', () => {
    beforeEach(() => {
        MockWebSocket.limpar()
        vi.stubGlobal('WebSocket', MockWebSocket)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('mostra "Aguardando dados..." antes de receber telemetria', () => {
        render(<Teste/>)

        expect(screen.getByText('Aguardando dados...')).toBeInTheDocument()
    })

    it('exibe os dados da corrida ao receber uma mensagem', async () => {
        render(<Teste/>)

        await act(async () => {
            MockWebSocket.ultima().emitirMensagem({corrida_id: 42, x: 1, y: 1})
        })

        expect(screen.getByText('Dados recebidos da corrida 42')).toBeInTheDocument()
    })
})
