import {useState} from 'react'
import Navbar from './components/Navbar'
import MazeCanvas from './components/MazeCanvas'
import StatusPanel from './components/StatusPanel'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Teste from "./components/teste.jsx";
import Dahsboard from "./pages/Dashboard.jsx";
import Historico from "./pages/Historico.jsx";


export default function App() {
    const [faseAtual, setFaseAtual] = useState('labirinto01')

    return (
        <BrowserRouter>
      <Routes>
      <Route path="/testes" element={<Teste/>}></Route>
      <Route path="/" element={<Dahsboard/>}/>
      <Route path="/historico" element={<Historico/>}/>
</Routes>
</BrowserRouter>

)

}