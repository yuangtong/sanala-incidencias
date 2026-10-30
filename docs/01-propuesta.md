# 01 · Propuesta del producto (PRD)

> Estado: **borrador v0.1 — pendiente de aprobación**. No se escribe código hasta aprobar este documento.

Nombre: **Señala**. Plataforma web donde los estudiantes de la facultad reportan incidencias y un administrador las gestiona hasta resolverlas.

Inspiración: **Zendesk** (bandeja de tickets, estados, seguimiento) + **Stack Overflow** (hilos públicos, votos, respuesta destacada).

---

## 1. Problema

Hoy un estudiante que encuentra un proyector roto, un laboratorio sin internet o un baño clausurado no tiene un canal claro para reportarlo. Lo comenta en grupos de WhatsApp, se lo dice a un profesor o no lo reporta. Resultado:

- El responsable se entera tarde, o nunca.
- La misma incidencia se reporta muchas veces por canales distintos, sin forma de saber cuántas personas están afectadas.
- El estudiante no recibe respuesta ni sabe si alguien está atendiendo su reporte.
- Algunos temas (seguridad, trato de personal) no se reportan por miedo a exponerse.

## 2. Usuarios

| Perfil | Qué necesita |
|---|---|
| **Estudiante que reporta** | Reportar en menos de 2 minutos, con foto o video, y saber en qué estado está su caso. Poder hacerlo sin exponer su identidad ante otros estudiantes. |
| **Estudiante que lee** | Ver si su problema ya fue reportado, sumarse ("a mí también me pasa") y comentar. |
| **Administrador encargado** | Una bandeja ordenada de casos, con datos de contacto del autor, para priorizar, cambiar el estado y responder. |

## 3. Objetivos

1. Un estudiante puede registrar una incidencia completa (con evidencia) en **menos de 2 minutos**.
2. El **100 %** de incidencias tiene un correo verificado para seguimiento, incluso las anónimas.
3. Ninguna incidencia anónima expone la identidad del autor a otros estudiantes (comprobado en la base de datos, no solo en la interfaz).
4. Las incidencias duplicadas bajan, porque los estudiantes se suman a un caso público existente en lugar de crear otro.
5. El administrador puede ver, filtrar y actualizar el estado de cualquier caso desde una sola pantalla.

## 4. Fuera de alcance (v1)

| No haremos | Por qué |
|---|---|
| App móvil nativa | La web responsive basta para la demo y el despliegue en Vercel. |
| Varios administradores con roles y asignación entre áreas | Un solo rol `admin` cubre el caso. Se deja el modelo preparado para crecer. |
| Chat en tiempo real | Los comentarios por hilo cubren la conversación. |
| Integración con sistemas de la universidad (SSO, Paideia) | Requiere permisos institucionales. Usamos login por enlace al correo. |
| Moderación automática con IA | Es otro proyecto. El admin puede ocultar comentarios manualmente (P1). |

## 5. Historias de usuario

**Estudiante que reporta**
- Como estudiante, quiero reportar una incidencia con título, descripción, categoría y ubicación para que el encargado entienda qué pasa y dónde.
- Como estudiante, quiero adjuntar fotos o un video corto como evidencia para que no haya dudas del problema.
- Como estudiante, quiero marcar mi reporte como **anónimo** para que otros estudiantes no sepan que fui yo, sabiendo que el administrador sí verá mi correo.
- Como estudiante, quiero elegir si mi reporte es **público** o **privado** para decidir si la comunidad puede verlo y comentarlo.
- Como estudiante, quiero ver el estado de mis reportes en "Mis incidencias" para saber si alguien los está atendiendo.

**Estudiante que lee**
- Como estudiante, quiero buscar y filtrar incidencias públicas para ver si mi problema ya fue reportado.
- Como estudiante, quiero votar "a mí también me pasa" para que el encargado vea cuántas personas están afectadas.
- Como estudiante, quiero comentar en una incidencia pública (también de forma anónima) para aportar información.

**Administrador**
- Como administrador, quiero una bandeja con todas las incidencias (públicas y privadas), ordenable por estado, categoría, votos y antigüedad, para priorizar.
- Como administrador, quiero ver el correo del autor aunque la incidencia sea anónima para poder contactarlo.
- Como administrador, quiero cambiar el estado y dejar una nota para que el estudiante vea el avance.
- Como administrador, quiero publicar una **respuesta oficial** destacada en el hilo, como la respuesta aceptada en Stack Overflow.

**Casos límite**
- El archivo supera el tamaño permitido o tiene un formato no aceptado: mensaje claro antes de subir.
- El estudiante intenta comentar en una incidencia privada: la opción no existe.
- El admin cambia una incidencia a privada (por ejemplo, contiene datos sensibles): desaparece del feed y los comentarios quedan ocultos.
- No hay incidencias que coincidan con un filtro: estado vacío con acceso directo a "Reportar".

## 6. Requisitos

### P0 — imprescindible para la demo

| # | Requisito | Criterio de aceptación |
|---|---|---|
| R1 | **Ingreso con correo** (enlace mágico, sin contraseña) | Dado un correo válido, cuando el estudiante pide el enlace, recibe un correo y al abrirlo queda dentro. Sin sesión no se puede reportar, votar ni comentar; sí se puede leer el feed público. |
| R2 | **Formulario de incidencia** | Campos: título (10–120 caracteres), descripción (mín. 30), categoría (lista fija), ubicación (pabellón + aula/ambiente), fecha en que ocurrió, visibilidad (pública/privada), anónimo (sí/no). Validación en el formulario y en la base de datos. |
| R3 | **Anonimato** | Si es anónima, en el feed, el detalle y los comentarios se muestra "Estudiante anónimo". La API pública **no devuelve** el correo ni el id del autor. El admin ve nombre y correo. |
| R4 | **Visibilidad pública/privada** | Privada: solo la ven el autor y el admin; no admite comentarios ni votos. Pública: aparece en el feed y admite comentarios y votos. |
| R5 | **Evidencia audiovisual** | Hasta 3 archivos por incidencia. Imágenes JPG/PNG/WEBP ≤ 10 MB; video MP4/WEBM ≤ 50 MB. Vista previa antes de enviar. Los archivos de incidencias privadas solo se sirven al autor y al admin (enlaces firmados). |
| R6 | **Feed público** estilo Stack Overflow | Lista con votos, número de comentarios, estado, categoría y antigüedad. Orden: recientes / más votadas / sin resolver. Búsqueda por texto y filtro por categoría y estado. |
| R7 | **Hilo de comentarios** | Comentarios en orden cronológico, con opción de anonimato. La respuesta oficial del admin aparece fijada arriba y resaltada. |
| R8 | **Votos "a mí también"** | Un voto por usuario por incidencia; se puede retirar. |
| R9 | **Mis incidencias** | El autor ve sus casos (públicos y privados) con su estado y el historial de cambios. |
| R10 | **Bandeja del administrador** estilo Zendesk | Tabla con todas las incidencias; filtros por estado, categoría y visibilidad; detalle con datos del autor; cambio de estado con nota; respuesta oficial. |
| R11 | **Código de caso** legible | Cada incidencia tiene un código `INC-0001` visible en todas las pantallas para referirse a ella. |

### P1 — si da el tiempo

- Correo automático al autor cuando cambia el estado de su incidencia.
- Admin oculta comentarios inapropiados; estudiante puede reportar un comentario.
- Admin marca una incidencia como duplicada y enlaza la original.
- Notas internas del admin (no visibles al estudiante).
- Prioridad (baja / media / alta / urgente) asignada por el admin.
- Restringir el ingreso al dominio institucional (ver preguntas abiertas).

### P2 — a futuro (el diseño no debe impedirlos)

- Varios administradores por área (TI, infraestructura, bienestar) con asignación de casos.
- Métricas: tiempo promedio de resolución, incidencias por categoría y pabellón.
- Mapa de la facultad con incidencias por pabellón.

## 7. Estados de una incidencia

```
Nueva ──▶ En revisión ──▶ En progreso ──▶ Resuelta ──▶ Cerrada
               │                              │
               ├──▶ Rechazada                 └──▶ (el autor puede reabrir → En revisión)  [P1]
               └──▶ Duplicada  [P1]
```

Cada cambio queda en un historial con fecha, estado anterior, estado nuevo y nota del admin.

## 8. Categorías iniciales

Infraestructura · Equipos y laboratorios · Red y servicios TI · Limpieza y servicios higiénicos · Seguridad · Servicios académicos · Otro

## 9. Métricas de éxito (para la demo y el pitch)

- **Tiempo para reportar**: menos de 2 minutos en la prueba con un compañero (cronometrado).
- **Tarea completada**: 3 de 3 compañeros logran reportar con evidencia sin ayuda.
- **Privacidad**: prueba documentada de que una consulta directa a la API no devuelve el correo de un autor anónimo.
- **Seguimiento**: el autor ve el cambio de estado inmediatamente después de que el admin lo hace.

## 10. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Backend | Supabase (Postgres + Auth + Storage). |
| Ingreso | Cualquier correo, verificado con enlace mágico. Restringir al dominio institucional queda como P1. |
| Aviso por correo al cambiar estado | P1. En la v1 el seguimiento se hace en "Mis incidencias". |
| Nombre | **Señala**. |

### Preguntas abiertas

| Pregunta | Quién decide | ¿Bloquea? |
|---|---|---|
| ¿Qué integrante hace de administrador en la demo? | Equipo | No |

## 11. Entregables del laboratorio

| Entregable | Cómo lo cubrimos |
|---|---|
| 1. Informe de exploración del problema | Secciones 1–2 de este documento, ampliadas con la conversación inicial. |
| 2. Producto funcional | App desplegada en Vercel con URL pública para que otra persona la pruebe. |
| 3. Documento breve del producto | Resumen de este PRD + arquitectura + instrucciones de uso. |
| 4. Declaración de uso de IA | `docs/declaracion-ia.md`: qué herramientas, para qué partes, y qué revisó el equipo. |
| Video pitch (≤ 10 min, todos participan) | PPT + guion por integrante (siguiente iteración). |
