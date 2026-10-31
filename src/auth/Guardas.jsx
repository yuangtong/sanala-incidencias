import { Navigate, useLocation } from 'react-router-dom'
import { useSesion } from './Sesion'

export function RequiereSesion({ children }) {
  const { sesion, cargando } = useSesion()
  const ubicacion = useLocation()
  if (cargando) return <p className="sutil">Cargando…</p>
  if (!sesion) return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  return children
}

export function RequiereAdmin({ children }) {
  const { sesion, esAdmin, cargando } = useSesion()
  const ubicacion = useLocation()
  if (cargando) return <p className="sutil">Cargando…</p>
  if (!sesion) return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  if (!esAdmin) return <div className="aviso error">Esta sección es solo para la administración.</div>
  return children
}
