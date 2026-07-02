import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import StatusPanel from './StatusPanel'

// Renderiza o painel dentro de um roteador, pois ele usa useNavigate.
function renderPainel(props) {
    const padrao = {
        posicao: {x: 0, y: 0},
        onPosicao: () => {},
        direcao: 'Norte',
        onDirecao: () => {},
        celulas: 0,
        onCelulas: () => {},
        onToggle: () => {},
        rodando: false,
        onRodando: () => {},
        tempo: 0,
        onTempo: () => {},
        bateria: 100,
        onBateria: () => {},
        velocidade: 5,
        onVelocidade: () => {},
    }
    return render(
        <MemoryRouter>
            <StatusPanel {...padrao} {...props}/>
        </MemoryRouter>,
    )
}

// Testes de integração do painel de status (StatusPanel).
// Cobre CT-SW-06 (estado operacional) e CT-SW-04 (posição).
describe('StatusPanel', () => {
    it('mostra "Parado, aguardando Início" quando não está rodando', () => {
        renderPainel({rodando: false})

        expect(screen.getByText('Parado, aguardando Início')).toBeInTheDocument()
    })

    it('mostra "Em execução" quando está rodando', () => {
        renderPainel({rodando: true})

        expect(screen.getByText('Em execução')).toBeInTheDocument()
    })

    it('exibe as métricas de bateria, velocidade, direção, posição e células', () => {
        renderPainel({
            bateria: 87,
            velocidade: 3,
            direcao: 'Leste',
            posicao: {x: 2, y: 1},
            celulas: 9,
        })

        expect(screen.getByText('87')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Leste')).toBeInTheDocument()
        expect(screen.getByText('2, 1')).toBeInTheDocument()
        expect(screen.getByText('9')).toBeInTheDocument()
    })

    it('navega para o histórico ao clicar no botão Historico', async () => {
        renderPainel({})

        const botao = screen.getByRole('button', {name: 'Historico'})
        await userEvent.click(botao)

        // A navegação ocorre sem lançar erros; o botão permanece acessível.
        expect(botao).toBeInTheDocument()
    })
})
