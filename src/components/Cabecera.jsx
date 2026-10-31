import { useState } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useSesion } from '../auth/Sesion'
import { IconoBandera } from './Iconos'

export default function Cabecera() {
  const { sesion, perfil, esAdmin, salir } = useSesion()
  const [params] = useSearchParams()
  const [texto, setTexto] = useState(params.get('q') ?? '')
  const navegar = useNavigate()

  function buscar(e) {
    e.preventDefault()
    const q = texto.trim()
    navegar(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  const clase = ({ isActive }) => `enlace-nav${isActive ? ' activo' : ''}`

  return (
    <header className="cabecera">
      <div className="contenedor cabecera-interior">
        <Link to="/" className="logo" aria-label="Señala, inicio">
          <IconoBandera width="24" height="24" style={{ color: 'var(--marca)' }} />
          Señala
        </Link>

        <form className="buscador" role="search" onSubmit={buscar}>
          <label htmlFor="buscar" className="oculto-visual">Buscar incidencias</label>
          <input
            id="buscar"
            type="search"
            placeholder="Buscar incidencias…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </form>

        <nav className="nav" aria-label="Principal">
          <NavLink to="/" end className={(p) => clase(p) + ' opcional'}>Incidencias</NavLink>
          {sesion && <NavLink to="/mis-incidencias" className={clase}>Mis incidencias</NavLink>}
          {esAdmin && <NavLink to="/admin" className={clase}>Bandeja</NavLink>}
          {sesion ? (
            <button className="boton fantasma" onClick={salir} title={perfil?.email}>Salir</button>
          ) : (
            <NavLink to="/ingresar" className={clase}>Ingresar</NavLink>
          )}
          <Link to="/reportar" className="boton">Reportar</Link>
        </nav>
      </div>
    </header>
  )
}
