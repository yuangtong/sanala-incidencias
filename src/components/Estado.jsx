import { ESTADOS } from '../lib/constantes'

export default function Estado({ estado }) {
  return <span className={`estado estado-${estado}`}>{ESTADOS[estado]}</span>
}
