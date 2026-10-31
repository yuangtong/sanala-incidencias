import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FilaIncidencia from '../components/FilaIncidencia'

export default function MisIncidencias() {
  const [lista, setLista] = useState(null)

  useEffect(() => {
    supabase
      .from('v_incidencias')
      .select('*')
      .eq('es_mia', true)
      .order('actualizada_en', { ascending: false })
      .then(({ data }) => setLista(data ?? []))
  }, [])

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Mis incidencias</h1>
          <p className="sutil">Tus reportes públicos y privados, con su estado actual.</p>
        </div>
        <Link to="/reportar" className="boton">Reportar incidencia</Link>
      </div>
      {lista === null ? (
        <p className="vacio">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="vacio">
          <p>Todavía no has reportado ninguna incidencia.</p>
          <Link to="/reportar" className="boton">Reportar la primera</Link>
        </div>
      ) : (
        <ul className="lista-incidencias" style={{ borderTop: '1px solid var(--linea)' }}>
          {lista.map((inc) => <FilaIncidencia key={inc.id} inc={inc} />)}
        </ul>
      )}
    </>
  )
}
