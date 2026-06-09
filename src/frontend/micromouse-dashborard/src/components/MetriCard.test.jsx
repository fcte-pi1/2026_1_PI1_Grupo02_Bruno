import {describe, it, expect} from 'vitest'
import {render, screen} from '@testing-library/react'
import MetriCard from './MetriCard'

// Testes unitários do cartão de métrica (MetriCard).
// Cobre CT-SW-06 (exibição do estado operacional: bateria, velocidade etc.).
describe('MetriCard', () => {
    it('exibe título, valor e unidade', () => {
        render(<MetriCard titulo="Bateria" valor={80} unidade="%"/>)

        expect(screen.getByText('Bateria')).toBeInTheDocument()
        expect(screen.getByText('80')).toBeInTheDocument()
        expect(screen.getByText('%')).toBeInTheDocument()
    })

    it('não renderiza a barra de progresso quando showBarra é falso', () => {
        const {container} = render(<MetriCard titulo="Direção" valor="Norte"/>)

        // Sem barra, há apenas o container do cartão e o bloco de valor/unidade.
        expect(container.querySelectorAll('div')).toHaveLength(2)
    })

    it('renderiza a barra de progresso quando showBarra é verdadeiro', () => {
        const {container} = render(
            <MetriCard titulo="Bateria" valor={80} unidade="%" maximo={100} showBarra={true}/>,
        )

        // Container + valor/unidade + trilho da barra + preenchimento.
        expect(container.querySelectorAll('div')).toHaveLength(4)
    })

    it('usa cor verde quando o valor é maior que 50', () => {
        const {container} = render(
            <MetriCard valor={80} maximo={100} showBarra={true}/>,
        )
        const preenchimento = container.querySelectorAll('div')[3]

        expect(preenchimento).toHaveStyle({backgroundColor: '#22c55e'})
        expect(preenchimento).toHaveStyle({width: '80%'})
    })

    it('usa cor amarela quando o valor está entre 21 e 50', () => {
        const {container} = render(
            <MetriCard valor={40} maximo={100} showBarra={true}/>,
        )
        const preenchimento = container.querySelectorAll('div')[3]

        expect(preenchimento).toHaveStyle({backgroundColor: '#facc15'})
    })

    it('usa cor vermelha quando o valor é 20 ou menos', () => {
        const {container} = render(
            <MetriCard valor={15} maximo={100} showBarra={true}/>,
        )
        const preenchimento = container.querySelectorAll('div')[3]

        expect(preenchimento).toHaveStyle({backgroundColor: '#ef4444'})
    })
})
