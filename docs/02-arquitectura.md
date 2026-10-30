# 02 · Arquitectura

> Estado: **borrador v0.1 — pendiente de aprobación**.

## 1. Visión general

Arquitectura sencilla de dos piezas: una **SPA en React** desplegada en Vercel y **Supabase** como backend gestionado (base de datos, autenticación, archivos). No hay servidor propio que mantener.

```
┌─────────────────────────────┐         ┌──────────────────────────────────────┐
│  Navegador                  │         │  Supabase (plan gratuito)            │
│  React + Vite (SPA)         │  HTTPS  │                                      │
│  servida por Vercel         │ ──────▶ │  Auth      enlace mágico por correo  │
│                             │         │  Postgres  tablas + RLS + vistas     │
│  supabase-js (clave anon)   │ ◀────── │  Storage   bucket privado evidencias │
└─────────────────────────────┘         └──────────────────────────────────────┘
```

**Por qué Supabase y no un backend propio**

- El requisito clave (anonimato real, privado vs. público) se resuelve con **Row Level Security** en Postgres: la regla vive en la base de datos, así que aunque alguien llame a la API directamente no puede ver lo que no le corresponde.
- Trae autenticación por correo y almacenamiento de archivos listos.
- El frontend sigue siendo una app estática: despliegue en Vercel sin configuración especial.
- Es fácil de explicar y defender en la exposición: "la seguridad está en la base de datos, no en el botón".

## 2. Stack

| Capa | Elección | Motivo |
|---|---|---|
| Frontend | React 18 + Vite | Pedido por el curso; arranque rápido. |
| Lenguaje | JavaScript (ES2022) | Más fácil de defender por todo el equipo que TypeScript. |
| Ruteo | React Router | Rutas públicas, de estudiante y de admin. |
| Estilos | CSS propio con variables (sin framework de UI) | Identidad visual propia; evita el aspecto genérico. |
| Datos | `@supabase/supabase-js` | Cliente oficial: auth, consultas y storage. |
| Backend | Supabase (Postgres 15, Auth, Storage) | Ver arriba. |
| Despliegue | Vercel | Conectado al repositorio de GitHub; cada push a `main` despliega. |

## 3. Modelo de datos

```
perfiles ─────────────┐
  id (= auth.users.id) │
  nombre               │
  email                │
  rol: estudiante|admin│
                       │ 1
                       │
                       │ n
incidencias ───────────┴──────────────────────────────────────────────┐
  id (uuid)                     visibilidad: publica | privada         │
  numero (serial → INC-0001)    anonimo (bool)                         │
  titulo                        estado: nueva | en_revision |          │
  descripcion                           en_progreso | resuelta |       │
  categoria                             cerrada | rechazada            │
  ubicacion                     autor_id → perfiles.id                 │
  fecha_ocurrencia              creada_en / actualizada_en             │
        │ 1                                                            │
        ├── n  adjuntos            (ruta en storage, tipo, tamaño)     │
        ├── n  comentarios         (autor_id, cuerpo, anonimo,         │
        │                           es_oficial, oculto)                │
        ├── n  votos               PK (incidencia_id, usuario_id)      │
        └── n  historial_estados   (de, a, nota, admin_id, fecha)      │
```

Restricciones en la base de datos (no solo en el formulario):
- `titulo` entre 10 y 120 caracteres, `descripcion` mínimo 30.
- `categoria` y `estado` como `enum`.
- Comentarios y votos solo se pueden insertar si la incidencia es `publica`.
- Solo el admin puede cambiar `estado`; un *trigger* registra cada cambio en `historial_estados`.

## 4. Privacidad y anonimato (el punto central)

**Regla:** el anonimato es frente al público, no frente al administrador.

| Quién mira | Incidencia pública no anónima | Incidencia pública anónima | Incidencia privada |
|---|---|---|---|
| Visitante sin sesión | Ve todo, con nombre del autor | Ve todo, autor = "Estudiante anónimo" | No la ve |
| Otro estudiante | Igual que arriba, puede votar/comentar | Igual que arriba, puede votar/comentar | No la ve |
| Autor | Ve todo | Ve todo y se le indica "publicado como anónimo" | Ve todo |
| Administrador | Ve todo + correo | Ve todo + **nombre y correo** | Ve todo + correo |

Cómo se garantiza:

1. La tabla `incidencias` **no se lee directamente** desde el cliente. Se lee a través de una vista `incidencias_publicas` que devuelve `autor_nombre = NULL` y omite `autor_id` cuando `anonimo = true` y quien consulta no es el autor ni el admin. Lo mismo para `comentarios_publicos`.
2. La tabla `perfiles` (donde está el correo) solo la puede leer el propio usuario y el admin.
3. Políticas RLS:
   - `select` en incidencias: `visibilidad = 'publica' OR autor_id = auth.uid() OR es_admin()`.
   - `insert`: cualquier usuario autenticado, con `autor_id = auth.uid()` forzado.
   - `update` de estado: solo `es_admin()`.
4. Storage: bucket `evidencias` **privado**. Los archivos se sirven con URL firmada de corta duración, y la política de lectura replica la regla de visibilidad de la incidencia.
5. Prueba que mostraremos en el video: llamar a la API con la clave pública y verificar que una incidencia anónima no trae ni nombre ni correo.

## 5. Rutas de la aplicación

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/` | Todos | Feed de incidencias públicas (estilo Stack Overflow) |
| `/i/:numero` | Según visibilidad | Detalle de la incidencia + hilo de comentarios |
| `/ingresar` | Todos | Ingreso con enlace mágico |
| `/reportar` | Estudiante | Formulario de nueva incidencia |
| `/mis-incidencias` | Estudiante | Mis casos y su estado |
| `/admin` | Admin | Bandeja de incidencias (estilo Zendesk) |
| `/admin/i/:numero` | Admin | Vista de gestión: datos del autor, estado, respuesta oficial |

## 6. Estructura del proyecto

```
portal-incidencias/
├── docs/                    ← propuesta, arquitectura, diseño, declaración de IA
├── supabase/
│   ├── schema.sql           ← tablas, enums, vistas
│   ├── policies.sql         ← RLS y storage
│   └── seed.sql             ← datos de ejemplo para la demo
├── src/
│   ├── lib/supabase.js      ← cliente
│   ├── auth/                ← contexto de sesión, guardas de ruta
│   ├── pages/               ← una carpeta por ruta
│   ├── components/          ← TarjetaIncidencia, BadgeEstado, SubidaEvidencia, Hilo…
│   └── styles/              ← tokens.css, base.css
├── .env.example             ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── vercel.json              ← reescritura de rutas a index.html (SPA)
└── README.md
```

## 7. Despliegue

1. Crear proyecto en Supabase, ejecutar `schema.sql`, `policies.sql` y `seed.sql`.
2. En Supabase Auth, añadir la URL de Vercel como URL de redirección del enlace mágico.
3. Marcar el perfil de un integrante como `admin` (una línea de SQL).
4. Conectar el repo de GitHub a Vercel, cargar las dos variables `VITE_…` y desplegar.
5. `vercel.json` reescribe todas las rutas a `index.html` para que funcione React Router.

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| El correo del enlace mágico tarda o cae en spam en la demo | Dejar sesiones iniciadas antes de grabar; Supabase permite configurar SMTP propio si hiciera falta. |
| Límite del plan gratuito (50 MB por archivo, 1 GB de storage) | Límite de 50 MB por video y 3 archivos por incidencia. |
| Contenido ofensivo en comentarios | P1: el admin oculta comentarios. Los comentarios anónimos siguen ligados a un correo verificado, lo que desalienta el abuso. |
