import {test, expect} from '@playwright/test'
import {mockarTelemetria} from './utils'

// Suíte E2E de navegação e controle da interface, executada pela GUI.
test.describe('Navegação e controles da interface', () => {
    test.beforeEach(async ({page}) => {
        // Sem backend real, intercepta o WebSocket para evitar conexões pendentes.
        await mockarTelemetria(page, [])
        await page.goto('/')
    })

    test('seleciona a fase do labirinto pela barra de navegação', async ({page}) => {
        await page.getByRole('button', {name: 'Labirinto 8x8'}).click()

        // O cabeçalho do mapa deve refletir a fase escolhida.
        await expect(page.getByRole('heading', {name: 'Labirinto 8x8'})).toBeVisible()
        await expect(page.getByText('8 x 8')).toBeVisible()
    })

    test('CT-SW-07 — inicia e para a corrida pelo cronômetro', async ({page}) => {
        // Estado inicial: parado.
        await expect(page.getByText('Parado, aguardando Início')).toBeVisible()

        await page.getByRole('button', {name: 'Iniciar'}).click()

        // Em execução após iniciar.
        await expect(page.getByText('Em execução')).toBeVisible()
        await expect(page.getByRole('button', {name: 'Parar'})).toBeVisible()

        await page.getByRole('button', {name: 'Parar'}).click()
        await expect(page.getByText('Parado, aguardando Início')).toBeVisible()
    })

    // CT-SW-09 e CT-SW-10 dependem da página de Histórico, ainda não implementada
    // no frontend. O teste fica registrado para ser habilitado quando a tela existir.
    test.fixme('CT-SW-09 — consulta o histórico de corridas', async ({page}) => {
        await page.getByRole('button', {name: 'Historico'}).click()
        await expect(page).toHaveURL(/historico/)
    })
})
