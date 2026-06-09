import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuração dos testes unitários e de integração do frontend.
// O ambiente jsdom simula o navegador e o vitest-canvas-mock fornece o
// contexto 2D do <canvas> usado pelo MazeCanvas.
export default defineConfig({
    plugins: [react()],
    // Usa o runtime automático de JSX para que não seja preciso importar React
    // em cada componente/teste.
    esbuild: {jsx: 'automatic'},
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.js'],
        css: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**/*.{js,jsx}'],
            exclude: [
                'src/main.jsx',
                'src/test/**',
                'src/**/*.test.{js,jsx}',
                '**/*.config.js',
            ],
        },
    },
})
