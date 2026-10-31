import { Route, Routes } from 'react-router-dom'
import Cabecera from './components/Cabecera'
import { RequiereAdmin, RequiereSesion } from './auth/Guardas'
import Feed from './pages/Feed'
import Detalle from './pages/Detalle'
import Ingresar from './pages/Ingresar'
import Reportar from './pages/Reportar'
import MisIncidencias from './pages/MisIncidencias'
import Bandeja from './pages/Bandeja'

export default function App() {
  return (
    <>
      <Cabecera />
      <main className="contenedor">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/i/:numero" element={<Detalle />} />
          <Route path="/ingresar" element={<Ingresar />} />
          <Route path="/reportar" element={<RequiereSesion><Reportar /></RequiereSesion>} />
          <Route path="/mis-incidencias" element={<RequiereSesion><MisIncidencias /></RequiereSesion>} />
          <Route path="/admin" element={<RequiereAdmin><Bandeja /></RequiereAdmin>} />
          <Route path="*" element={<p className="vacio">Página no encontrada.</p>} />
        </Routes>
      </main>
      <footer className="pie-pagina">
        <div className="contenedor">
          Señala · Laboratorio 5. El anonimato es frente a otros estudiantes: la administración ve el correo del autor para darle seguimiento.
        </div>
      </footer>
    </>
  )
}
