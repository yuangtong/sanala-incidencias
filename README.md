# Señala · Portal de incidencias de la facultad

Proyecto del **Laboratorio 5: producto informático**.

Los estudiantes reportan incidencias de la facultad con fotos o video, de forma pública o privada y con opción de anonimato. Un administrador las gestiona hasta resolverlas. Inspirado en Zendesk (bandeja y estados) y Stack Overflow (hilos, votos y respuesta destacada).

## Qué hace

- **Reportar**: título, descripción, categoría, ubicación, fecha y hasta 3 archivos de evidencia (imágenes de hasta 10 MB, video de hasta 50 MB).
- **Anonimato**: otros estudiantes ven "Estudiante anónimo". El administrador sí ve el nombre y el correo para dar seguimiento. La regla está en la base de datos, no solo en la pantalla.
- **Pública o privada**: las públicas aparecen en el listado, con votos "a mí también me pasa" y comentarios. Las privadas solo las ven el autor y el administrador, en una conversación privada.
- **Seguimiento**: cada incidencia tiene un código (`INC-0001`) y una línea de tiempo de estados con notas del administrador.
- **Bandeja del administrador**: tabla por estado, categoría y visibilidad. Desde el detalle puede cambiar el estado, publicar la respuesta oficial y ocultar comentarios.

## Stack

React 18 + Vite · Supabase (Postgres con RLS, Auth, Storage) · Vercel

## Ejecutar en local

```bash
npm install
```

```bash
cp .env.example .env
```

Completa `.env` con la URL y la clave pública del proyecto de Supabase.

```bash
npm run dev
```

## Base de datos

Ejecuta `supabase/migrations/0001_esquema.sql` en el editor SQL del proyecto de Supabase. Para nombrar administrador a alguien antes de que se registre:

```sql
insert into correos_admin values ('correo@ejemplo.com');
```

## Cuentas de demostración

| Rol | Correo |
|---|---|
| Administrador | `admin.demo@senala.test` |
| Estudiante | `lucia.ramos@senala.test` |
| Estudiante | `diego.quispe@senala.test` |
| Estudiante | `valeria.soto@senala.test` |

El equipo tiene la contraseña de estas cuentas.

## Documentos

| Documento | Contenido |
|---|---|
| [docs/01-propuesta.md](docs/01-propuesta.md) | Problema, usuarios, objetivos, requisitos, métricas, entregables |
| [docs/02-arquitectura.md](docs/02-arquitectura.md) | Stack, modelo de datos, privacidad y anonimato, rutas, despliegue |
| [docs/03-diseno-ux.md](docs/03-diseno-ux.md) | Pautas, dirección visual, pantallas, estados vacíos y errores |
| [docs/declaracion-ia.md](docs/declaracion-ia.md) | Declaración de uso de IA |
