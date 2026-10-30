# 03 · Diseño y experiencia de usuario

> Estado: **borrador v0.1 — pendiente de aprobación**.

## 1. Pautas de diseño

1. **Reportar es lo primero.** El botón "Reportar incidencia" está visible en todas las pantallas.
2. **La privacidad se dice, no se supone.** Junto a los controles de anonimato y visibilidad, una línea explica exactamente quién verá qué: *"Otros estudiantes verán 'Estudiante anónimo'. El administrador sí verá tu correo para darte seguimiento."*
3. **El estado siempre a la vista.** Cada incidencia muestra su código (`INC-0042`) y su estado en el mismo lugar en todas las pantallas.
4. **Densidad de herramienta, no de red social.** Listas compactas y legibles (como Stack Overflow), sin tarjetas gigantes ni imágenes decorativas.
5. **Accesible.** Contraste AA, foco visible con teclado, formularios con etiquetas reales y mensajes de error junto al campo.

## 2. Dirección visual

**Concepto: "tablón de avisos de la facultad".** Sobrio e institucional, con el estado de cada caso como único elemento de color fuerte.

| Elemento | Propuesta |
|---|---|
| Fondo | Papel cálido `#F6F4EF`; superficies `#FFFFFF` |
| Texto | Tinta `#1B1F24`; secundario `#5A6270` |
| Acento de marca | Azul tinta `#1F3A5F` (botón principal, enlaces) |
| Estados | Nueva `#5A6270` · En revisión `#8A6D1F` · En progreso `#1F5FA8` · Resuelta `#2F6B3F` · Rechazada `#8E2B2B` |
| Tipografía | **IBM Plex Sans** para interfaz; **IBM Plex Mono** para códigos `INC-0042`, fechas y metadatos |
| Forma | Bordes de 1 px, radios pequeños (4 px), sin sombras difusas ni degradados |
| Iconos | Línea fina, solo donde aportan significado (adjunto, comentario, candado de privado) |

## 3. Pantallas

### 3.1 Feed público `/`
```
┌──────────────────────────────────────────────────────────────────┐
│ Señala                  [ Buscar incidencias… ]   Ingresar  [Reportar] │
├──────────────────────────────────────────────────────────────────┤
│ Incidencias públicas         Recientes · Más votadas · Sin resolver │
│ Categoría [Todas ▾]  Estado [Todos ▾]                              │
├──────┬───────────────────────────────────────────────────────────┤
│  24  │ Proyector del aula A-301 no enciende                      │
│ votos│ INC-0042 · Equipos y laboratorios · Pab. A          ●En progreso │
│   5  │ Estudiante anónimo · hace 2 h · adj. 2                      │
│ com. │                                                           │
├──────┼───────────────────────────────────────────────────────────┤
│  …   │ …                                                         │
└──────┴───────────────────────────────────────────────────────────┘
```

### 3.2 Detalle `/i/:numero`
- Cabecera: código, título, estado, categoría, ubicación, autor (o "Estudiante anónimo"), fecha.
- Columna izquierda: botón de voto "A mí también me pasa" con contador.
- Cuerpo: descripción + galería de evidencia (imágenes y reproductor de video).
- **Respuesta oficial** fijada arriba del hilo, con borde del color de marca.
- Línea de tiempo de estados (Nueva → En revisión → …).
- Hilo de comentarios + caja para comentar con casilla "Comentar como anónimo".
- Si es privada: candado y texto "Solo tú y el administrador pueden ver esta incidencia".

### 3.3 Reportar `/reportar`
Un solo formulario en una columna, en tres bloques:
1. **Qué pasó** — título, descripción, categoría, ubicación, fecha.
2. **Evidencia** — zona para arrastrar o elegir archivos, vista previa, límites visibles.
3. **Privacidad** — dos opciones con explicación:
   - Visibilidad: ( ) Pública — la comunidad puede verla, votar y comentar / ( ) Privada — solo tú y el administrador.
   - [ ] Publicar como anónimo — texto de aclaración sobre el administrador.

Al enviar: pantalla de confirmación con el código `INC-0043` y enlace a "Mis incidencias".

### 3.4 Mis incidencias `/mis-incidencias`
Lista con código, título, estado, visibilidad (candado si es privada), última actualización. Al abrir, el detalle muestra el historial de estados con las notas del admin.

### 3.5 Bandeja del admin `/admin` (estilo Zendesk)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Bandeja    Nuevas (7)  En revisión (4)  En progreso (9)  Resueltas  Todas    │
│ Categoría ▾  Visibilidad ▾  Ordenar: antigüedad ▾                             │
├──────────┬──────────────────────────────┬────────────┬───────┬──────┬────────┤
│ Código   │ Asunto                       │ Autor      │ Votos │ Vis. │ Edad   │
│ INC-0042 │ Proyector A-301 no enciende  │ a.perez@…  │ 24    │ Púb. │ 2 h    │
│ INC-0041 │ Acoso en paradero (anónimo)  │ j.ruiz@…   │ —     │ Priv.│ 5 h    │
└──────────┴──────────────────────────────┴────────────┴───────┴──────┴────────┘
```

### 3.6 Gestión de un caso `/admin/i/:numero`
- Panel lateral: datos del autor (nombre, correo, botón "Escribir correo"), aviso si es anónima.
- Selector de estado + nota obligatoria al cambiar.
- Editor de respuesta oficial.
- Mismo hilo y evidencia que ve el estudiante.

## 4. Estados vacíos y errores

| Situación | Mensaje |
|---|---|
| Feed sin resultados | "No hay incidencias con estos filtros." + botón Reportar |
| Archivo demasiado grande | "El video pesa 63 MB. El máximo es 50 MB." (junto al archivo) |
| Formato no permitido | "Solo se aceptan JPG, PNG, WEBP, MP4 o WEBM." |
| Incidencia privada de otro | "Esta incidencia no existe o no tienes acceso." (no revela si existe) |
| Sin sesión al votar/comentar | Invitación a ingresar con el correo, y vuelta a la misma página |
