import {defineConfig, devices} from '@playwright/test'

// Configuração dos testes de sistema funcionais (end-to-end) executados pela
// interface gráfica. O servidor de desenvolvimento do Vite é iniciado
// automaticamente antes da suíte.
const PORTA = 5173
const URL_BASE = `http://localhost:${PORTA}`

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', {open: 'never'}]],
    use: {
        baseURL: URL_BASE,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
    ],
    webServer: {
        command: `npm run dev -- --port ${PORTA} --strictPort`,
        url: URL_BASE,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
})
