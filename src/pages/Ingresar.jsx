import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSesion } from '../auth/Sesion'

const MENSAJES = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'Email not confirmed': 'Primero confirma tu correo con el enlace que te enviamos.',
  'User already registered': 'Ya existe una cuenta con ese correo. Ingresa con tu contraseña.',
}

export default function Ingresar() {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  const [modo, setModo] = useState('ingresar')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  if (sesion) return <Navigate to={ubicacion.state?.desde ?? '/'} replace />

  async function enviar(e) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    setEnviando(true)
    if (modo === 'ingresar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: clave })
      if (error) setError(MENSAJES[error.message] ?? error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: clave,
        options: { data: { nombre: nombre.trim() }, emailRedirectTo: window.location.origin },
      })
      if (error) setError(MENSAJES[error.message] ?? error.message)
      else if (!data.session) setAviso(`Te enviamos un enlace a ${email}. Ábrelo para confirmar tu correo y luego ingresa.`)
    }
    setEnviando(false)
  }

  return (
    <div className="panel tarjeta-ingreso">
      <div>
        <h1>{modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}</h1>
        <p className="sutil" style={{ marginTop: 4 }}>
          Tu correo sirve para darte seguimiento. Aunque publiques como anónimo, otros estudiantes no lo verán.
        </p>
      </div>
      <div className="pestanas" role="group" aria-label="Modo">
        <button style={{ flex: 1 }} aria-pressed={modo === 'ingresar'} onClick={() => setModo('ingresar')}>Ingresar</button>
        <button style={{ flex: 1 }} aria-pressed={modo === 'registro'} onClick={() => setModo('registro')}>Crear cuenta</button>
      </div>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {modo === 'registro' && (
          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" type="text" required minLength={2} maxLength={60} value={nombre}
              onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div className="campo">
          <label htmlFor="email">Correo</label>
          <input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="campo">
          <label htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" required minLength={6} value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'} />
          {modo === 'registro' && <span className="ayuda">Mínimo 6 caracteres.</span>}
        </div>
        {error && <div className="aviso error" role="alert">{error}</div>}
        {aviso && <div className="aviso exito" role="status">{aviso}</div>}
        <button className="boton" disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
