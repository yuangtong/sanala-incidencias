# 02 · Arquitectura

> Estado: **v1.0 — aprobado e implementado**.

## 1. Visión general

Arquitectura sencilla de dos piezas: una **SPA en React** desplegada en Vercel y **Supabase** como backend gestionado (base de datos, autenticación, archivos). No hay servidor propio que mantener.

```
┌─────────────────────────────┐         ┌──────────────────────────────────────┐
│  Navegador                  │         │  Supabase (plan gratuito)            │
│  React + Vite (SPA)         │  HTTPS  │                                      │
│  servida por Vercel         │ ──────▶ │  Auth      correo + contraseña       │
│                             │         │  Postgres  tablas + RLS + vistas     │
│  supabase-js (clave anon)   │ ◀────── │  Storage   bucket privado evidencias │
└─────────────────────────────┘         └──────────────────────────────────────┘
```

**Por qué Supabase y no un backend propio**

- El requisito clave (anonimato real, privado vs. público) se resuelve con **Row Level Security** en Postgres: la regla vive en la base de datos, así que aunque alguien llame a la API directamente no puede ver lo que no le corresponde.
- Trae autenticación por correo (con verificación) y almacenamiento de archivos listos.
- Se usa correo + contraseña en lugar de enlace mágico: el servidor de correo gratuito de Supabase envía pocos correos por hora, y con contraseña solo se envía uno al registrarse.
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

1. Las tablas **no se leen directamente** desde el cliente (se revocó `SELECT`). Se leen a través de las vistas `v_incidencias`, `v_comentarios`, `v_adjuntos` y `v_historial`, que aplican el filtro de visibilidad y devuelven `autor_nombre = NULL` cuando la incidencia o comentario es anónimo y quien consulta no es el autor ni el admin. `autor_email` solo se llena para el admin.
2. La tabla `perfiles` (donde está el correo) solo la puede leer el propio usuario y el admin.
3. Políticas RLS:
   - `select` en incidencias: `visibilidad = 'publica' OR autor_id = auth.uid() OR es_admin()`.
   - `insert`: cualquier usuario autenticado, con `autor_id = auth.uid()` forzado.
   - cambio de estado: solo con la función `cambiar_estado()`, que verifica `es_admin()` y escribe el historial.
   - comentarios: en públicas cualquiera con sesión; en privadas solo autor y admin (conversación privada). Solo el admin puede marcar `es_oficial`.
   - votos: solo en incidencias públicas, uno por persona.
4. Storage: bucket `evidencias` **privado**. Los archivos se sirven con URL firmada de corta duración, y la política de lectura replica la regla de visibilidad de la incidencia.
5. Prueba que mostraremos en el video: llamar a la API con la clave pública y verificar que una incidencia anónima no trae ni nombre ni correo.

## 5. Rutas de la aplicación

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/` | Todos | Feed de incidencias públicas (estilo Stack Overflow) |
| `/i/:numero` | Según visibilidad | Detalle + hilo. El admin ve además un panel con autor, correo y cambio de estado |
| `/ingresar` | Todos | Ingresar o crear cuenta (correo + contraseña) |
| `/reportar` | Estudiante | Formulario de nueva incidencia |
| `/mis-incidencias` | Estudiante | Mis casos y su estado |
| `/admin` | Admin | Bandeja de incidencias (estilo Zendesk) |

## 6. Estructura del proyecto

```
portal-incidencias/
├── docs/                    ← propuesta, arquitectura, diseño, declaración de IA
├── supabase/
│   └── migrations/0001_esquema.sql  ← tablas, vistas, RLS, funciones y storage
├── src/
│   ├── lib/supabase.js      ← cliente
│   ├── lib/constantes.js    ← categorías, estados, límites, formato de fechas
│   ├── auth/                ← sesión y guardas de ruta
│   ├── pages/               ← Feed, Detalle, Reportar, MisIncidencias, Bandeja, Ingresar
│   ├── components/          ← Cabecera, FilaIncidencia, Estado, Iconos
│   └── styles/app.css       ← tokens y estilos
├── .env.example             ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── vercel.json              ← reescritura de rutas a index.html (SPA)
└── README.md
```

## 7. Despliegue

1. Crear proyecto en Supabase y ejecutar `supabase/migrations/0001_esquema.sql`.
2. En Supabase › Authentication › URL Configuration, poner la URL de Vercel como *Site URL* (para el enlace de confirmación de correo).
3. Para dar rol admin: `insert into correos_admin values ('correo@ejemplo.com');` antes de que esa persona se registre, o `update perfiles set rol = 'admin' where email = '…';` si ya existe.
4. Conectar el repo de GitHub a Vercel, cargar las dos variables `VITE_…` y desplegar.
5. `vercel.json` reescribe todas las rutas a `index.html` para que funcione React Router.

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| El servidor de correo gratuito de Supabase limita los envíos por hora | Para la demo usar las cuentas ya creadas; para uso real, configurar SMTP propio o desactivar la confirmación de correo. |
| Límite del plan gratuito (50 MB por archivo, 1 GB de storage) | Límite de 50 MB por video y 3 archivos por incidencia. |
| Contenido ofensivo en comentarios | P1: el admin oculta comentarios. Los comentarios anónimos siguen ligados a un correo verificado, lo que desalienta el abuso. |
