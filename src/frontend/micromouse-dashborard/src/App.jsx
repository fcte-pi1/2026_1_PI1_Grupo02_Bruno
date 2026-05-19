import Navbar from './components/Navbar'
import MazeCanvas from './components/MazeCanvas'
import StatusPanel from './components/StatusPanel'

function App() {

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">

      {/* Barra de navegação */}
      <Navbar />

      {/* Conteúdo principal */}
      <main className="flex flex-1 gap-4 p-4">

        {/* Painel esquerdo - labirinto */}
        <div className="flex-1 bg-[#1a1d2e] rounded-xl p-4">
          <MazeCanvas />
          <h1>teste</h1>
        </div>

        {/* Painel direito - status */}
        <div className="w-72 bg-[#1a1d2e] rounded-xl p-4">
          <StatusPanel />
        </div>

      </main>

      {/* Rodapé */}
      <footer className="text-center text-xs text-gray-500 py-2">
        MicroMouse
      </footer>

    </div>)

}

export default App
