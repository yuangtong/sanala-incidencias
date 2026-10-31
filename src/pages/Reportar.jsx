import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  CATEGORIAS, MAX_ARCHIVOS, MAX_IMAGEN, MAX_VIDEO, TIPOS_IMAGEN, TIPOS_VIDEO, megas,
} from '../lib/constantes'
import { IconoAdjunto } from '../components/Iconos'

const hoy = () => new Date().toISOString().slice(0, 10)

function validarArchivo(archivo) {
  const esImagen = TIPOS_IMAGEN.includes(archivo.type)
  const esVideo = TIPOS_VIDEO.includes(archivo.type)
  if (!esImagen && !esVideo) return `“${archivo.name}”: solo se aceptan JPG, PNG, WEBP, MP4 o WEBM.`
  if (esImagen && archivo.size > MAX_IMAGEN) return `“${archivo.name}” pesa ${megas(archivo.size)}. El máximo para imágenes es 10 MB.`
  if (esVideo && archivo.size > MAX_VIDEO) return `“${archivo.name}” pesa ${megas(archivo.size)}. El máximo para videos es 50 MB.`
  return null
}

export default function Reportar() {
  const navegar = useNavigate()
  const entrada = useRef(null)
  const [form, setForm] = useState({
    titulo: '', descripcion: '', categoria: '', ubicacion: '', fecha: hoy(),
    visibilidad: 'publica', anonimo: false,
  })
  const [archivos, setArchivos] = useState([]) // { archivo, url }
  const [errores, setErrores] = useState({})
  const [errorArchivos, setErrorArchivos] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  // Libera las vistas previas al salir
  useEffect(() => () => archivos.forEach((a) => URL.revokeObjectURL(a.url)), []) // eslint-disable-line

  const cambiar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function agregar(lista) {
    setErrorArchivos(null)
    const nuevos = []
    for (const archivo of lista) {
      const problema = validarArchivo(archivo)
      if (problema) { setErrorArchivos(problema); continue }
      if (archivos.length + nuevos.length >= MAX_ARCHIVOS) {
        setErrorArchivos(`Puedes adjuntar como máximo ${MAX_ARCHIVOS} archivos.`)
        break
      }
      nuevos.push({ archivo, url: URL.createObjectURL(archivo) })
    }
    setArchivos((a) => [...a, ...nuevos])
  }

  function quitar(i) {
    URL.revokeObjectURL(archivos[i].url)
    setArchivos((a) => a.filter((_, j) => j !== i))
  }

  function validar() {
    const e = {}
    const t = form.titulo.trim()
    const d = form.descripcion.trim()
    if (t.length < 10) e.titulo = 'Escribe un título de al menos 10 caracteres.'
    if (t.length > 120) e.titulo = 'El título no puede pasar de 120 caracteres.'
    if (d.length < 30) e.descripcion = 'Describe el problema con al menos 30 caracteres.'
    if (!form.categoria) e.categoria = 'Elige una categoría.'
    if (form.ubicacion.trim().length < 2) e.ubicacion = 'Indica dónde ocurre.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function enviar(ev) {
    ev.preventDefault()
    setErrorEnvio(null)
    if (!validar()) return
    setEnviando(true)

    // El id se genera aquí para poder subir la evidencia a su carpeta
    const id = crypto.randomUUID()
    const { error } = await supabase.from('incidencias').insert({
      id,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      categoria: form.categoria,
      ubicacion: form.ubicacion.trim(),
      fecha_ocurrencia: form.fecha || null,
      visibilidad: form.visibilidad,
      anonimo: form.anonimo,
    })
    if (error) {
      setErrorEnvio(error.message)
      setEnviando(false)
      return
    }

    const fallidos = []
    for (const { archivo } of archivos) {
      const ext = archivo.name.split('.').pop()?.toLowerCase() || 'bin'
      const ruta = `${id}/${crypto.randomUUID()}.${ext}`
      const subida = await supabase.storage.from('evidencias').upload(ruta, archivo, { contentType: archivo.type })
      if (subida.error) { fallidos.push(archivo.name); continue }
      const registro = await supabase.from('adjuntos').insert({
        incidencia_id: id, ruta, nombre: archivo.name, tipo_mime: archivo.type, tamano: archivo.size,
      })
      if (registro.error) fallidos.push(archivo.name)
    }

    const { data } = await supabase.from('v_incidencias').select('numero').eq('id', id).single()
    navegar(`/i/${data.numero}`, { state: { nueva: true, fallidos } })
  }

  const contador = (texto, max) => <span className="ayuda">{texto.trim().length}/{max}</span>

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Reportar incidencia</h1>
          <p className="sutil">Cuanto más concreto sea el reporte, más rápido se puede atender.</p>
        </div>
      </div>

      <form className="formulario" onSubmit={enviar} noValidate>
        <section className="panel bloque" aria-labelledby="b1">
          <h2 id="b1"><span className="paso">01</span> Qué pasó</h2>
          <div className="campo">
            <label htmlFor="titulo">Título</label>
            <input id="titulo" type="text" maxLength={120} value={form.titulo} onChange={cambiar('titulo')}
              placeholder="Ej. Proyector del aula A-301 no enciende" aria-invalid={!!errores.titulo} />
            {errores.titulo ? <span className="error-campo">{errores.titulo}</span> : contador(form.titulo, 120)}
          </div>
          <div className="campo">
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" maxLength={5000} value={form.descripcion} onChange={cambiar('descripcion')}
              placeholder="Qué ocurre, desde cuándo y a quiénes afecta." aria-invalid={!!errores.descripcion} />
            {errores.descripcion ? <span className="error-campo">{errores.descripcion}</span> : contador(form.descripcion, 5000)}
          </div>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="categoria">Categoría</label>
              <select id="categoria" value={form.categoria} onChange={cambiar('categoria')} aria-invalid={!!errores.categoria}>
                <option value="">Elige una…</option>
                {Object.entries(CATEGORIAS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
              {errores.categoria && <span className="error-campo">{errores.categoria}</span>}
            </div>
            <div className="campo">
              <label htmlFor="fecha">Fecha en que ocurrió</label>
              <input id="fecha" type="date" max={hoy()} value={form.fecha} onChange={cambiar('fecha')} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="ubicacion">Ubicación</label>
            <input id="ubicacion" type="text" maxLength={120} value={form.ubicacion} onChange={cambiar('ubicacion')}
              placeholder="Pabellón, piso, aula o ambiente" aria-invalid={!!errores.ubicacion} />
            {errores.ubicacion && <span className="error-campo">{errores.ubicacion}</span>}
          </div>
        </section>

        <section className="panel bloque" aria-labelledby="b2">
          <h2 id="b2"><span className="paso">02</span> Evidencia <span className="sutil" style={{ fontWeight: 400, fontSize: 14 }}>opcional</span></h2>
          <div
            className={`zona-archivos${arrastrando ? ' arrastrando' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => entrada.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && entrada.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); agregar([...e.dataTransfer.files]) }}
          >
            <IconoAdjunto width="20" height="20" />
            <p>Arrastra fotos o videos aquí, o <b>elige archivos</b></p>
            <p style={{ fontSize: 13 }}>Hasta {MAX_ARCHIVOS} archivos · Imágenes JPG, PNG o WEBP hasta 10 MB · Video MP4 o WEBM hasta 50 MB</p>
          </div>
          <input ref={entrada} type="file" hidden multiple accept={[...TIPOS_IMAGEN, ...TIPOS_VIDEO].join(',')}
            onChange={(e) => { agregar([...e.target.files]); e.target.value = '' }} />
          {errorArchivos && <div className="aviso error" role="alert">{errorArchivos}</div>}
          {archivos.length > 0 && (
            <div className="previas">
              {archivos.map(({ archivo, url }, i) => (
                <div className="previa" key={url}>
                  {archivo.type.startsWith('video')
                    ? <video src={url} muted />
                    : <img src={url} alt={`Vista previa de ${archivo.name}`} />}
                  <div className="pie">
                    <span title={archivo.name}>{megas(archivo.size)}</span>
                    <button type="button" className="boton fantasma" onClick={() => quitar(i)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel bloque" aria-labelledby="b3">
          <h2 id="b3"><span className="paso">03</span> Privacidad</h2>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="etiqueta" style={{ marginBottom: 8 }}>¿Quién puede ver esta incidencia?</legend>
            <div className="grupo-opciones">
              <label className="opcion-radio">
                <input type="radio" name="visibilidad" value="publica" checked={form.visibilidad === 'publica'} onChange={cambiar('visibilidad')} />
                <span>
                  <span className="titulo-op">Pública</span>
                  <span className="desc-op" style={{ display: 'block' }}>Aparece en el listado. Otros estudiantes pueden votar y comentar.</span>
                </span>
              </label>
              <label className="opcion-radio">
                <input type="radio" name="visibilidad" value="privada" checked={form.visibilidad === 'privada'} onChange={cambiar('visibilidad')} />
                <span>
                  <span className="titulo-op">Privada</span>
                  <span className="desc-op" style={{ display: 'block' }}>Solo tú y la administración. Útil para temas sensibles.</span>
                </span>
              </label>
            </div>
          </fieldset>
          <label className="opcion-radio">
            <input type="checkbox" checked={form.anonimo} onChange={cambiar('anonimo')} />
            <span>
              <span className="titulo-op">Publicar como anónimo</span>
              <span className="desc-op" style={{ display: 'block' }}>
                Otros estudiantes verán “Estudiante anónimo”. La administración sí verá tu nombre y correo para darte seguimiento.
              </span>
            </span>
          </label>
        </section>

        {errorEnvio && <div className="aviso error" role="alert">No se pudo registrar la incidencia: {errorEnvio}</div>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="boton" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar reporte'}</button>
          <button type="button" className="boton secundario" onClick={() => navegar(-1)} disabled={enviando}>Cancelar</button>
        </div>
      </form>
    </>
  )
}
