import { Link } from 'react-router-dom'
import Estado from './Estado'
import { CATEGORIAS, codigo, haceTiempo } from '../lib/constantes'
import { IconoAdjunto, IconoCandado, IconoUbicacion } from './Iconos'

export default function FilaIncidencia({ inc }) {
  const publica = inc.visibilidad === 'publica'
  return (
    <li className="fila-incidencia">
      <div className="metricas">
        {publica && <span><b>{inc.votos}</b> {inc.votos === 1 ? 'voto' : 'votos'}</span>}
        <span className={inc.tiene_respuesta ? 'respondida' : ''}>
          <b>{inc.num_comentarios}</b> {inc.num_comentarios === 1 ? 'comentario' : 'comentarios'}
        </span>
      </div>
      <div>
        <h2>
          <Link to={`/i/${inc.numero}`}>{inc.titulo}</Link>
        </h2>
        <p className="extracto">{inc.descripcion}</p>
        <div className="meta">
          <span className="mono">{codigo(inc.numero)}</span>
          <span className="etiqueta-chip">{CATEGORIAS[inc.categoria]}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconoUbicacion width="14" height="14" /> {inc.ubicacion}
          </span>
          {inc.num_adjuntos > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title="Evidencia adjunta">
              <IconoAdjunto width="14" height="14" /> {inc.num_adjuntos}
            </span>
          )}
          {!publica && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconoCandado width="14" height="14" /> Privada
            </span>
          )}
          <span className="derecha">
            {inc.autor_nombre ?? 'Estudiante anónimo'} · {haceTiempo(inc.creada_en)}
          </span>
          <Estado estado={inc.estado} />
        </div>
      </div>
    </li>
  )
}
