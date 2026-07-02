import {describe, it, expect} from 'vitest'
import {render, screen} from '@testing-library/react'
import MazeCanvas from './MazeCanvas'

// Grid de exemplo com uma célula contendo todas as paredes, para exercitar
// todos os ramos de desenho do canvas.
const gridExemplo = {
    '0,0': {linha: 0, coluna: 0, parede_norte: true, parede_leste: true, parede_oeste: true, parede_sul: true},
    '1,1': {linha: 1, coluna: 1, parede_norte: false, parede_leste: false, parede_oeste: false, parede_sul: false},
}

// Testes do componente de renderização do labirinto (MazeCanvas).
// Apoia CT-SW-04 (posição) e CT-SW-05 (trajeto percorrido).
describe('MazeCanvas', () => {
    it('exibe o rótulo e o tipo da fase atual', () => {
        render(
            <MazeCanvas fase="Labirinto 01" grid={{}} setGrid={() => {}} setRastro={() => {}}
                        mouseX={0} mouseY={0} rastro={[]}/>,
        )

        expect(screen.getByText('Labirinto 4x4')).toBeInTheDocument()
        expect(screen.getByText('4 x 4')).toBeInTheDocument()
    })

    it('renderiza a legenda completa do mapa', () => {
        render(
            <MazeCanvas fase="Labirinto 01" grid={{}} setGrid={() => {}} setRastro={() => {}}
                        mouseX={0} mouseY={0} rastro={[]}/>,
        )

        expect(screen.getByText('Mouse')).toBeInTheDocument()
        expect(screen.getByText('Trajeto')).toBeInTheDocument()
        expect(screen.getByText('Parede')).toBeInTheDocument()
        expect(screen.getByText('Destino')).toBeInTheDocument()
    })

    it('desenha o grid, o mouse e o trajeto sem lançar erros', () => {
        const {container} = render(
            <MazeCanvas
                fase="Labirinto 01"
                grid={gridExemplo}
                setGrid={() => {}}
                setRastro={() => {}}
                mouseX={1}
                mouseY={1}
                rastro={[
                    {x: 0, y: 0, direcao: 'N'},
                    {x: 1, y: 0, direcao: 'L'},
                    {x: 1, y: 1, direcao: 'S'},
                    {x: 0, y: 1, direcao: 'O'},
                ]}
            />,
        )

        // O elemento canvas deve estar presente após a renderização.
        expect(container.querySelector('canvas')).toBeInTheDocument()
    })
})
