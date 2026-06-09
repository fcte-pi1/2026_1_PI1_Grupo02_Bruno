import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import App from './App'
import {MockWebSocket} from './test/mockWebSocket'

// Teste de roteamento: a rota raiz "/" deve renderizar o Dashboard.
describe('App (roteamento)', () => {
    beforeEach(() => {
        MockWebSocket.limpar()
        vi.stubGlobal('WebSocket', MockWebSocket)
        window.history.pushState({}, '', '/')
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('renderiza o Dashboard na rota raiz', () => {
        render(<App/>)

        // Elementos característicos do Dashboard (Navbar e rodapé).
        expect(screen.getByText('Ao vivo')).toBeInTheDocument()
        expect(screen.getByText('MicroMouse')).toBeInTheDocument()
    })
})
