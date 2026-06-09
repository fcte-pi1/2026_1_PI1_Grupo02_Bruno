import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cronometro from './Cronometro'

// Testes unitários do cronômetro.
// Apoia CT-SW-07 (acompanhamento da corrida) ao validar a contagem de tempo.
describe('Cronometro', () => {
    it('formata o tempo em minutos:segundos.milissegundos', () => {
        // 1 min, 5 s e 123 ms => 65123 ms.
        render(<Cronometro tempo={65123} onTempo={() => {}} onToglle={() => {}} rodando={false}/>)

        expect(screen.getByText('01:05.')).toBeInTheDocument()
        expect(screen.getByText('123')).toBeInTheDocument()
    })

    it('exibe 00:00.000 quando o tempo é zero', () => {
        render(<Cronometro tempo={0} onTempo={() => {}} onToglle={() => {}} rodando={false}/>)

        expect(screen.getByText('00:00.')).toBeInTheDocument()
        expect(screen.getByText('000')).toBeInTheDocument()
    })

    it('mostra "Iniciar" quando parado e "Parar" quando rodando', () => {
        const {rerender} = render(
            <Cronometro tempo={0} onTempo={() => {}} onToglle={() => {}} rodando={false}/>,
        )
        expect(screen.getByRole('button')).toHaveTextContent('Iniciar')

        rerender(<Cronometro tempo={0} onTempo={() => {}} onToglle={() => {}} rodando={true}/>)
        expect(screen.getByRole('button')).toHaveTextContent('Parar')
    })

    it('zera o tempo e alterna o estado ao iniciar', async () => {
        const onTempo = vi.fn()
        const onToglle = vi.fn()
        render(<Cronometro tempo={5000} onTempo={onTempo} onToglle={onToglle} rodando={false}/>)

        await userEvent.click(screen.getByRole('button'))

        expect(onTempo).toHaveBeenCalledWith(0)
        expect(onToglle).toHaveBeenCalledTimes(1)
    })

    it('apenas alterna o estado ao parar, sem zerar o tempo', async () => {
        const onTempo = vi.fn()
        const onToglle = vi.fn()
        render(<Cronometro tempo={5000} onTempo={onTempo} onToglle={onToglle} rodando={true}/>)

        await userEvent.click(screen.getByRole('button'))

        expect(onTempo).not.toHaveBeenCalled()
        expect(onToglle).toHaveBeenCalledTimes(1)
    })
})
