import {test, expect} from '@playwright/test'
import {mockarTelemetria, telemetria} from './utils'

// Suíte E2E de telemetria em tempo real, executada pela interface gráfica.
// Rastreamento: CT-SW-01 (sincronização de telemetria), CT-SW-04 (posição),
// CT-SW-05 (trajeto/contagem de células) e CT-SW-06 (estado operacional).
test.describe('Telemetria em tempo real', () => {
    test('CT-SW-01/04/06 — exibe os dados recebidos do robô', async ({page}) => {
        await mockarTelemetria(page, [telemetria()])
        await page.goto('/')

        // Posição (CT-SW-04).
        await expect(page.getByText('2, 3')).toBeVisible()
        // Estado operacional: direção, velocidade e bateria (CT-SW-06).
        await expect(page.getByText('Leste')).toBeVisible()
        await expect(page.getByText('4', {exact: true})).toBeVisible()
        await expect(page.getByText('75', {exact: true})).toBeVisible()
    })

    test('CT-SW-05 — acumula a contagem de células visitadas', async ({page}) => {
        await mockarTelemetria(page, [
            telemetria({x: 0, y: 0, posicao_ordem: 1, celula: {linha: 0, coluna: 0}}),
            telemetria({x: 1, y: 0, posicao_ordem: 2, celula: {linha: 0, coluna: 1}}),
            telemetria({x: 1, y: 1, posicao_ordem: 3, celula: {linha: 1, coluna: 1}}),
        ])
        await page.goto('/')

        // A última posição e a contagem de células devem refletir a corrida.
        await expect(page.getByText('1, 1')).toBeVisible()
        await expect(page.getByText('3', {exact: true})).toBeVisible()
    })
})
