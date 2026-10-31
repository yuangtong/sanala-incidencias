export const CATEGORIAS = {
  infraestructura: 'Infraestructura',
  equipos: 'Equipos y laboratorios',
  red_ti: 'Red y servicios TI',
  limpieza: 'Limpieza y servicios higiénicos',
  seguridad: 'Seguridad',
  academico: 'Servicios académicos',
  otro: 'Otro',
}

export const ESTADOS = {
  nueva: 'Nueva',
  en_revision: 'En revisión',
  en_progreso: 'En progreso',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  rechazada: 'Rechazada',
}

export const ESTADOS_ABIERTOS = ['nueva', 'en_revision', 'en_progreso']

// Límites de evidencia (también se validan en Supabase Storage)
export const MAX_ARCHIVOS = 3
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
export const TIPOS_VIDEO = ['video/mp4', 'video/webm']
export const MAX_IMAGEN = 10 * 1024 * 1024
export const MAX_VIDEO = 50 * 1024 * 1024

export const codigo = (numero) => `INC-${String(numero).padStart(4, '0')}`

export const megas = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
export function haceTiempo(fecha) {
  const seg = (new Date(fecha).getTime() - Date.now()) / 1000
  const pasos = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.35, 'week'],
    [12, 'month'],
    [Infinity, 'year'],
  ]
  let valor = seg
  for (const [limite, unidad] of pasos) {
    if (Math.abs(valor) < limite) return rtf.format(Math.round(valor), unidad)
    valor /= limite
  }
  return ''
}

export const fechaLarga = (fecha) =>
  new Date(fecha).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })

export const fechaCorta = (fecha) =>
  new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', { dateStyle: 'medium' })
