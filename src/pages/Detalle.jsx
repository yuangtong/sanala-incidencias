import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSesion } from '../auth/Sesion'
import Estado from '../components/Estado'
import {
  CATEGORIAS, ESTADOS, codigo, fechaCorta, fechaLarga, haceTiempo,
} from '../lib/constantes'
import { IconoAnonimo, IconoArriba, IconoCandado } from '../components/Iconos'

export default function Detalle() {
  const { numero } = useParams()
  const { state } = useLocation()
  const navegar = useNavigate()
  const { sesion, esAdmin } = useSesion()
  const [inc, setInc] = useState(undefined)
  const [comentarios, setComentarios] = useState([])
  const [adjuntos, setAdjuntos] = useState([])
  const [historial, setHistorial] = useState([])

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('v_incidencias').select('*').eq('numero', numero).maybeSingle()
    setInc(data)
    if (!data) return
    const [c, a, h] = await Promise.all([
      supabase.from('v_comentarios').select('*').eq('incidencia_id', data.id).order('creado_en'),
      supabase.from('v_adjuntos').select('*').eq('incidencia_id', data.id).order('creado_en'),
      supabase.from('v_historial').select('*').eq('incidencia_id', data.id).order('creado_en'),
    ])
    setComentarios(c.data ?? [])
    setHistorial(h.data ?? [])
    const lista = a.data ?? []
    if (lista.length) {
      const firmadas = await supabase.storage.from('evidencias').createSignedUrls(lista.map((x) => x.ruta), 3600)
      const urls = Object.fromEntries((firmadas.data ?? []).map((f) => [f.path, f.signedUrl]))
      setAdjuntos(lista.map((x) => ({ ...x, url: urls[x.ruta] })))
    } else setAdjuntos([])
  }, [numero])

  useEffect(() => { cargar() }, [cargar, sesion])

  if (inc === undefined) return <p className="vacio">Cargando…</p>
  if (inc === null)
    return (
      <div className="vacio">
        <p>Esta incidencia no existe o no tienes acceso.</p>
        <Link to="/" className="boton secundario">Volver al listado</Link>
      </div>
    )

  const publica = inc.visibilidad === 'publica'
  const oficiales = comentarios.filter((c) => c.es_oficial && !c.oculto)
  const resto = comentarios.filter((c) => !(c.es_oficial && !c.oculto))
  const puedeComentar = sesion && (publica || inc.es_mia || esAdmin)

  async function votar() {
    if (!sesion) return navegar('/ingresar', { state: { desde: `/i/${numero}` } })
    const r = inc.votada
      ? await supabase.from('votos').delete().eq('incidencia_id', inc.id).eq('usuario_id', sesion.user.id)
      : await supabase.from('votos').insert({ incidencia_id: inc.id })
    if (!r.error) cargar()
  }

  return (
    <>
      {state?.nueva && (
        <div className="aviso exito" role="status" style={{ marginBottom: 20 }}>
          Incidencia registrada con el código <b className="mono">{codigo(inc.numero)}</b>. Puedes seguir su estado en{' '}
          <Link to="/mis-incidencias">Mis incidencias</Link>.
          {state.fallidos?.length > 0 && ` No se pudieron subir: ${state.fallidos.join(', ')}.`}
        </div>
      )}

      <div className="detalle">
        <article>
          <header className="detalle-cabecera">
            <div className="meta" style={{ marginTop: 0 }}>
              <span className="mono">{codigo(inc.numero)}</span>
              <Estado estado={inc.estado} />
              <span className="etiqueta-chip">{CATEGORIAS[inc.categoria]}</span>
              {!publica && (
                <span className="etiqueta-chip"><IconoCandado width="13" height="13" /> Privada</span>
              )}
            </div>
            <h1>{inc.titulo}</h1>
            <div className="meta" style={{ marginTop: 0 }}>
              <span>
                {inc.autor_nombre ?? 'Estudiante anónimo'}
                {inc.es_mia && inc.anonimo && ' (publicado como anónimo)'}
              </span>
              <span>Reportada {haceTiempo(inc.creada_en)}</span>
              <span>{inc.ubicacion}</span>
              {inc.fecha_ocurrencia && <span>Ocurrió el {fechaCorta(inc.fecha_ocurrencia)}</span>}
            </div>
          </header>

          {!publica && (
            <div className="aviso" style={{ marginBottom: 20 }}>
              Solo el autor y la administración pueden ver esta incidencia y su conversación.
            </div>
          )}

          <div className="cuerpo-incidencia">
            {publica ? (
              <div className="voto">
                <button onClick={votar} aria-pressed={inc.votada} aria-label="A mí también me pasa"
                  title={inc.votada ? 'Retirar mi voto' : 'A mí también me pasa'}>
                  <IconoArriba />
                </button>
                <span className="cuenta">{inc.votos}</span>
                <span className="texto">A mí también</span>
              </div>
            ) : <div />}
            <div>
              <p className="descripcion">{inc.descripcion}</p>
              {adjuntos.length > 0 && (
                <div className="evidencias">
                  {adjuntos.map((a) =>
                    a.tipo_mime.startsWith('video') ? (
                      <video key={a.id} src={a.url} controls preload="metadata" aria-label={a.nombre} />
                    ) : (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                        <img src={a.url} alt={`Evidencia: ${a.nombre}`} loading="lazy" />
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <section className="seccion" aria-labelledby="t-hilo">
            <h2 id="t-hilo">
              {publica ? 'Comentarios' : 'Conversación con la administración'}
              <span className="sutil mono">{comentarios.filter((c) => !c.oculto).length}</span>
            </h2>

            {oficiales.map((c) => (
              <div className="respuesta-oficial" key={c.id}>
                <div className="rotulo">Respuesta oficial · {haceTiempo(c.creado_en)}</div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{c.cuerpo}</p>
                {esAdmin && <Moderar c={c} alCambiar={cargar} />}
              </div>
            ))}

            {resto.length === 0 && oficiales.length === 0 && (
              <p className="sutil">Aún no hay comentarios.</p>
            )}
            {resto.map((c) => (
              <div className={`comentario${c.oculto ? ' oculto-mod' : ''}`} key={c.id}>
                <div className="autor">
                  <b>
                    {c.autor_nombre ?? (
                      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <IconoAnonimo width="13" height="13" /> Estudiante anónimo
                      </span>
                    )}
                  </b>
                  {c.autor_es_admin && <span className="etiqueta-chip">Administración</span>}
                  {c.es_mio && c.anonimo && <span>(tú, como anónimo)</span>}
                  {esAdmin && c.autor_email && <span className="mono">{c.autor_email}</span>}
                  <span>{haceTiempo(c.creado_en)}</span>
                  {c.oculto && <span className="etiqueta-chip">Oculto</span>}
                </div>
                <p>{c.cuerpo}</p>
                {esAdmin && <Moderar c={c} alCambiar={cargar} />}
              </div>
            ))}

            {puedeComentar ? (
              <FormComentario inc={inc} esAdmin={esAdmin} alEnviar={cargar} />
            ) : !sesion ? (
              <p style={{ marginTop: 16 }}>
                <Link to="/ingresar" state={{ desde: `/i/${numero}` }}>Ingresa</Link> para comentar o votar.
              </p>
            ) : null}
          </section>
        </article>

        <aside className="lateral">
          {esAdmin && <PanelAdmin inc={inc} alCambiar={cargar} />}
          <div className="panel">
            <h3>Seguimiento</h3>
            <ol className="linea-tiempo">
              {historial.map((h) => (
                <li key={h.id}>
                  <b>{ESTADOS[h.estado_nuevo]}</b>{' '}
                  <span className="sutil" style={{ fontSize: 13 }}>· {fechaLarga(h.creado_en)}</span>
                  {h.nota && <div className="nota">{h.nota}</div>}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </>
  )
}

function FormComentario({ inc, esAdmin, alEnviar }) {
  const [cuerpo, setCuerpo] = useState('')
  const [anonimo, setAnonimo] = useState(false)
  const [oficial, setOficial] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    if (cuerpo.trim().length < 2) return
    setEnviando(true)
    setError(null)
    const { error } = await supabase.from('comentarios').insert({
      incidencia_id: inc.id,
      cuerpo: cuerpo.trim(),
      anonimo: oficial ? false : anonimo,
      es_oficial: esAdmin && oficial,
    })
    setEnviando(false)
    if (error) return setError(error.message)
    setCuerpo('')
    setOficial(false)
    alEnviar()
  }

  return (
    <form className="form-comentario" onSubmit={enviar}>
      <label htmlFor="comentario" className="etiqueta">
        {esAdmin ? 'Responder' : 'Agregar un comentario'}
      </label>
      <textarea id="comentario" maxLength={3000} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)}
        placeholder={esAdmin ? 'Escribe una respuesta…' : '¿Tienes más información sobre esta incidencia?'} />
      {error && <div className="aviso error">{error}</div>}
      <div className="opciones-linea">
        <button className="boton" disabled={enviando || cuerpo.trim().length < 2}>
          {enviando ? 'Publicando…' : 'Publicar'}
        </button>
        {esAdmin ? (
          <label><input type="checkbox" checked={oficial} onChange={(e) => setOficial(e.target.checked)} /> Publicar como respuesta oficial</label>
        ) : (
          <label><input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} /> Comentar como anónimo</label>
        )}
      </div>
    </form>
  )
}

function Moderar({ c, alCambiar }) {
  async function alternar() {
    const { error } = await supabase.rpc('ocultar_comentario', { p_comentario: c.id, p_oculto: !c.oculto })
    if (!error) alCambiar()
  }
  return (
    <button className="boton fantasma" style={{ fontSize: 13, marginTop: 4 }} onClick={alternar}>
      {c.oculto ? 'Mostrar comentario' : 'Ocultar comentario'}
    </button>
  )
}

function PanelAdmin({ inc, alCambiar }) {
  const [estado, setEstado] = useState(inc.estado)
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => setEstado(inc.estado), [inc.estado])

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    const { error } = await supabase.rpc('cambiar_estado', { p_incidencia: inc.id, p_estado: estado, p_nota: nota })
    setGuardando(false)
    if (error) return setMensaje({ tipo: 'error', texto: error.message })
    setNota('')
    setMensaje({ tipo: 'exito', texto: 'Estado actualizado.' })
    alCambiar()
  }

  return (
    <div className="panel panel-admin">
      <h3>Gestión</h3>
      <dl className="datos" style={{ marginBottom: 16 }}>
        <dt>Autor</dt>
        <dd>{inc.autor_nombre}{inc.anonimo && <span className="sutil"> (anónimo al público)</span>}</dd>
        <dt>Correo</dt>
        <dd><a href={`mailto:${inc.autor_email}?subject=${encodeURIComponent(`${codigo(inc.numero)} · ${inc.titulo}`)}`}>{inc.autor_email}</a></dd>
        <dt>Visibilidad</dt>
        <dd>{inc.visibilidad === 'publica' ? 'Pública' : 'Privada'}</dd>
      </dl>
      <form onSubmit={guardar}>
        <div className="campo">
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="nota">Nota para el estudiante</label>
          <textarea id="nota" style={{ minHeight: 70 }} value={nota} onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Técnico programado para el jueves." required />
        </div>
        {mensaje && <div className={`aviso ${mensaje.tipo}`}>{mensaje.texto}</div>}
        <button className="boton" disabled={guardando || !nota.trim() || estado === inc.estado}>
          {guardando ? 'Guardando…' : 'Actualizar estado'}
        </button>
      </form>
    </div>
  )
}
