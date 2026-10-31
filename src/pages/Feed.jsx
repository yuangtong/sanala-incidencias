import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIAS, ESTADOS, ESTADOS_ABIERTOS } from '../lib/constantes'
import FilaIncidencia from '../components/FilaIncidencia'

const ORDENES = [
  ['recientes', 'Recientes'],
  ['votadas', 'Más votadas'],
  ['abiertas', 'Sin resolver'],
]

// Quita caracteres que romperían el filtro .or() de PostgREST
const limpiar = (q) => q.replace(/[,()%*\\]/g, ' ').trim()

export default function Feed() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const [orden, setOrden] = useState('recientes')
  const [categoria, setCategoria] = useState('')
  const [estado, setEstado] = useState('')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    let consulta = supabase.from('v_incidencias').select('*').eq('visibilidad', 'publica')
    if (categoria) consulta = consulta.eq('categoria', categoria)
    if (estado) consulta = consulta.eq('estado', estado)
    if (orden === 'abiertas') consulta = consulta.in('estado', ESTADOS_ABIERTOS)
    const texto = limpiar(q)
    if (texto) consulta = consulta.or(`titulo.ilike.%${texto}%,descripcion.ilike.%${texto}%,ubicacion.ilike.%${texto}%`)
    consulta =
      orden === 'votadas'
        ? consulta.order('votos', { ascending: false }).order('creada_en', { ascending: false })
        : consulta.order('creada_en', { ascending: false })

    consulta.limit(100).then(({ data, error }) => {
      if (!vigente) return
      setError(error?.message ?? null)
      setLista(data ?? [])
      setCargando(false)
    })
    return () => { vigente = false }
  }, [q, orden, categoria, estado])

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>{q ? `Resultados para “${q}”` : 'Incidencias públicas'}</h1>
          <p className="sutil">Antes de reportar, revisa si alguien ya lo hizo y súmate con tu voto.</p>
        </div>
        <Link to="/reportar" className="boton">Reportar incidencia</Link>
      </div>

      <div className="barra-filtros">
        <div className="pestanas" role="group" aria-label="Orden">
          {ORDENES.map(([valor, texto]) => (
            <button key={valor} aria-pressed={orden === valor} onClick={() => setOrden(valor)}>{texto}</button>
          ))}
        </div>
        <label className="oculto-visual" htmlFor="f-cat">Categoría</label>
        <select id="f-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIAS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <label className="oculto-visual" htmlFor="f-est">Estado</label>
        <select id="f-est" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <span className="sutil" style={{ marginLeft: 'auto', fontSize: 14 }}>
          {!cargando && `${lista.length} ${lista.length === 1 ? 'incidencia' : 'incidencias'}`}
        </span>
      </div>

      {error && <div className="aviso error" style={{ marginTop: 16 }}>No se pudo cargar: {error}</div>}
      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="vacio">
          <p>No hay incidencias con estos filtros.</p>
          <Link to="/reportar" className="boton">Reportar incidencia</Link>
        </div>
      ) : (
        <ul className="lista-incidencias">
          {lista.map((inc) => <FilaIncidencia key={inc.id} inc={inc} />)}
        </ul>
      )}
    </>
  )
}
