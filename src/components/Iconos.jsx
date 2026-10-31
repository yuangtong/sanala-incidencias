// Iconos de línea propios (sin dependencias)
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconoBandera = (p) => (
  <svg {...base} {...p}><path d="M6 3v18" /><path d="M6 4h12l-3 5 3 5H6" /></svg>
)
export const IconoAdjunto = (p) => (
  <svg {...base} {...p}><path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15 7" /></svg>
)
export const IconoComentario = (p) => (
  <svg {...base} {...p}><path d="M4 5h16v11H9l-5 4z" /></svg>
)
export const IconoCandado = (p) => (
  <svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
export const IconoArriba = (p) => (
  <svg {...base} width="20" height="20" {...p}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
)
export const IconoAnonimo = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /><path d="M3 3l18 18" /></svg>
)
export const IconoUbicacion = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
)
