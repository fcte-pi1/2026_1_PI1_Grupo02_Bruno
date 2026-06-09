// WebSocket falso usado nos testes de integração de telemetria.
// Permite controlar manualmente os eventos de conexão, mensagem e fechamento.
import {vi} from 'vitest'

export class MockWebSocket {
    static instances = []

    static ultima() {
        return MockWebSocket.instances[MockWebSocket.instances.length - 1]
    }

    static limpar() {
        MockWebSocket.instances = []
    }

    constructor(url) {
        this.url = url
        this.readyState = 0
        this.onopen = null
        this.onmessage = null
        this.onclose = null
        this.onerror = null
        this.send = vi.fn()
        MockWebSocket.instances.push(this)
    }

    close() {
        this.readyState = 3
        if (this.onclose) this.onclose({})
    }

    emitirAbertura() {
        this.readyState = 1
        if (this.onopen) this.onopen()
    }

    emitirMensagem(dados) {
        if (this.onmessage) this.onmessage({data: JSON.stringify(dados)})
    }

    emitirErro() {
        if (this.onerror) this.onerror(new Error('falha simulada'))
    }
}
