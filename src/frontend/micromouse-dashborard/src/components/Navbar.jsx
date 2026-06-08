const fases = [
  { id: 'Labirinto 01', label: 'Labirinto 4x4', cor: 'bg-purple-500',tipo:'4x4' },
  { id: 'Labirinto 02', label: 'Labirinto 8x8', cor: 'bg-pink-500',tipo:'8x8' },
  { id: 'Labirinto 03', label: 'Labirinto 16x16', cor: 'bg-green-500',tipo:'16x16' },
  { id: 'Desafio',     label: 'Desafio final', cor: 'bg-blue-500' },
]


export default function Navbar({ faseAtual, onFaseChange }) {
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-[#0f1117] border-b border-white/10">
      <div className="flex gap-3">
        {fases.map((fase) => (
          <button
            key={fase.id}
            onClick={() => onFaseChange(fase.id)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium text-white transition-opacity
              ${fase.cor}
              ${faseAtual === fase.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'}
            `}
          >
            {fase.label}
          </button>
        ))}
      </div>


      <div className="flex items-center gap-2 text-sm text-white">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Ao vivo
      </div>

    </nav>
  )
}