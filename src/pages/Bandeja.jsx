import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Estado from '../components/Estado'
import { CATEGORIAS, ESTADOS, codigo, haceTiempo } from '../lib/constantes'

const PESTANAS = [
  ['nueva', 'Nuevas'],
  ['en_revision', 'En revisión'],
  ['en_progreso', 'En progreso'],
  ['resuelta', 'Resueltas'],
  ['', 'Todas'],
]

const ORDENES = {
  antiguas: ['creada_en', true],
  recientes: ['creada_en', false],
  votadas: ['votos', false],
}

export default function Bandeja() {
  const navegar = useNavigate()
  const [todas, setTodas] = useState(null)
  const [pestana, setPestana] = useState('nueva')
  const [categoria, setCategoria] = useState('')
  const [visibilidad, setVisibilidad] = useState('')
  const [orden, setOrden] = useState('antiguas')

  useEffect(() => {
    supabase.from('v_incidencias').select('*').limit(1000).then(({ data }) => setTodas(data ?? []))
  }, [])

  const conteo = useMemo(() => {
    const c = {}
    for (const i of todas ?? []) c[i.estado] = (c[i.estado] ?? 0) + 1
    return c
  }, [todas])

  const filas = useMemo(() => {
    const [campo, asc] = ORDENES[orden]
    return (todas ?? [])
      .filter((i) => !pestana || i.estado === pestana)
      .filter((i) => !categoria || i.categoria === categoria)
      .filter((i) => !visibilidad || i.visibilidad === visibilidad)
      .sort((a, b) => {
        const x = a[campo], y = b[campo]
        return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1)
      })
  }, [todas, pestana, categoria, visibilidad, orden])

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Bandeja</h1>
          <p className="sutil">Todas las incidencias, públicas y privadas. Abre una para ver al autor y cambiar su estado.</p>
        </div>
      </div>

      <div className="pestanas-estado" role="group" aria-label="Estado">
        {PESTANAS.map(([valor, texto]) => (
          <button key={texto} aria-pressed={pestana === valor} onClick={() => setPestana(valor)}>
            {texto}
            <span className="cuenta">{valor ? conteo[valor] ?? 0 : todas?.length ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="barra-filtros" style={{ borderBottom: 0, paddingTop: 0 }}>
        <label className="oculto-visual" htmlFor="b-cat">Categoría</label>
        <select id="b-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIAS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <label className="oculto-visual" htmlFor="b-vis">Visibilidad</label>
        <select id="b-vis" value={visibilidad} onChange={(e) => setVisibilidad(e.target.value)}>
          <option value="">Pública y privada</option>
          <option value="publica">Solo públicas</option>
          <option value="privada">Solo privadas</option>
        </select>
        <label className="oculto-visual" htmlFor="b-ord">Ordenar</label>
        <select id="b-ord" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="antiguas">Más antiguas primero</option>
          <option value="recientes">Más recientes primero</option>
          <option value="votadas">Más votadas</option>
        </select>
      </div>

      {todas === null ? (
        <p className="vacio">Cargando…</p>
      ) : filas.length === 0 ? (
        <p className="vacio">No hay incidencias en esta vista.</p>
      ) : (
        <div className="tabla-contenedor panel">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Asunto</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th className="num">Votos</th>
                <th>Vis.</th>
                <th>Estado</th>
                <th>Antigüedad</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((i) => (
                <tr key={i.id} onClick={() => navegar(`/i/${i.numero}`)}>
                  <td className="mono">{codigo(i.numero)}</td>
                  <td>
                    <a href={`/i/${i.numero}`} onClick={(e) => e.preventDefault()}>{i.titulo}</a>
                  </td>
                  <td>
                    <div>{i.autor_nombre}</div>
                    <div className="mono sutil" style={{ fontSize: 12 }}>{i.autor_email}</div>
                    {i.anonimo && <span className="etiqueta-chip" style={{ marginTop: 4 }}>Anónimo al público</span>}
                  </td>
                  <td>{CATEGORIAS[i.categoria]}</td>
                  <td className="num">{i.visibilidad === 'publica' ? i.votos : '—'}</td>
                  <td>{i.visibilidad === 'publica' ? 'Pública' : 'Privada'}</td>
                  <td><Estado estado={i.estado} /></td>
                  <td className="sutil" title={ESTADOS[i.estado]}>{haceTiempo(i.creada_en)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
