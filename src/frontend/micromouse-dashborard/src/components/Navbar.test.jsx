import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from './Navbar'

// Testes unitários da barra de navegação de fases.
// Apoia a seleção de fase (labirintos 4x4, 8x8, 16x16 e desafio final).
describe('Navbar', () => {
    it('renderiza as quatro fases disponíveis', () => {
        render(<Navbar faseAtual="Labirinto 01" onFaseChange={() => {}}/>)

        expect(screen.getByRole('button', {name: 'Labirinto 4x4'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Labirinto 8x8'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Labirinto 16x16'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Desafio final'})).toBeInTheDocument()
    })

    it('exibe o indicador "Ao vivo"', () => {
        render(<Navbar faseAtual="Labirinto 01" onFaseChange={() => {}}/>)

        expect(screen.getByText('Ao vivo')).toBeInTheDocument()
    })

    it('chama onFaseChange com o id da fase selecionada', async () => {
        const onFaseChange = vi.fn()
        render(<Navbar faseAtual="Labirinto 01" onFaseChange={onFaseChange}/>)

        await userEvent.click(screen.getByRole('button', {name: 'Labirinto 8x8'}))

        expect(onFaseChange).toHaveBeenCalledWith('Labirinto 02')
    })

    it('destaca a fase ativa e atenua as demais', () => {
        render(<Navbar faseAtual="Labirinto 02" onFaseChange={() => {}}/>)

        const ativa = screen.getByRole('button', {name: 'Labirinto 8x8'})
        const inativa = screen.getByRole('button', {name: 'Labirinto 4x4'})

        expect(ativa.className).toContain('opacity-100')
        expect(inativa.className).toContain('opacity-40')
    })
})
