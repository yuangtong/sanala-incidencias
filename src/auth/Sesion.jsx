import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SesionContext = createContext(null)

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      if (!data.session) setCargando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva)
      if (!nueva) {
        setPerfil(null)
        setCargando(false)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const idUsuario = sesion?.user?.id
  useEffect(() => {
    if (!idUsuario) return
    supabase
      .from('perfiles')
      .select('id, email, nombre, rol')
      .eq('id', idUsuario)
      .single()
      .then(({ data }) => {
        setPerfil(data)
        setCargando(false)
      })
  }, [idUsuario])

  const valor = {
    sesion,
    perfil,
    cargando,
    esAdmin: perfil?.rol === 'admin',
    salir: () => supabase.auth.signOut(),
  }
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

export const useSesion = () => useContext(SesionContext)
