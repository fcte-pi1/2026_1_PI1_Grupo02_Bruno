// Setup global executado antes de cada arquivo de teste.
import '@testing-library/jest-dom'
import 'vitest-canvas-mock'
import {afterEach} from 'vitest'
import {cleanup} from '@testing-library/react'

// Desmonta a árvore React renderizada após cada teste para evitar vazamento
// de estado entre os casos.
afterEach(() => {
    cleanup()
})
