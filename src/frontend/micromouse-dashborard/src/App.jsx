import Dahsboard from "./pages/Dashboard.jsx";
import Historico from "./pages/Historico.jsx";
import {BrowserRouter, Route, Routes} from "react-router-dom";

export default function App(){
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dahsboard/>}/>
                <Route path="/historico" element={<Historico/>}/>
            </Routes>
        </BrowserRouter>
    )
}