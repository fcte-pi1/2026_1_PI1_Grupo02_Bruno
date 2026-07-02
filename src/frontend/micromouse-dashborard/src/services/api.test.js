import {describe, it, expect} from 'vitest'
import api from './api'

// Testes do cliente HTTP compartilhado (axios).
describe('cliente de API', () => {
    it('aponta para a base do backend', () => {
        expect(api.defaults.baseURL).toBe('http://localhost:8000')
    })

    it('expõe os métodos HTTP usados pela aplicação', () => {
        expect(typeof api.get).toBe('function')
        expect(typeof api.post).toBe('function')
    })
})
