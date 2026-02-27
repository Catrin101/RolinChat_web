# **Documento de Visión y Alcance v2.0**

## **RolinChat \- Plataforma Social de Roleplay Narrativo**

**Versión:** 2.0 (MVP Ajustado)  
**Stack:** Phaser 3 + Node.js + Socket.io  
**Plataforma:** Navegador Web (Chrome, Firefox, Edge) — sin instalación  
**Desarrollador:** Solo Developer  
**Modelo de Negocio:** Patreon \+ Contenido Modular Comunitario

---

## **1\. Resumen Ejecutivo**

**RolinChat** es una plataforma social 2D diseñada para entusiastas del roleplay narrativo que buscan una experiencia más inmersiva que el texto plano, pero más accesible que el 3D. A través de un sistema híbrido de vista isométrica (exploración) y una ventana de escenas (momentos dramáticos), los jugadores crean historias colaborativas usando avatares altamente personalizados y un chat especializado por comandos.

Al ejecutarse completamente en el navegador, **no requiere descarga ni instalación**. Los jugadores solo necesitan un enlace para unirse.

### **Diferenciador Clave:**

Sistema único de **Animaciones Conjuntas** donde dos jugadores participan en escenas con roles Activo/Pasivo, transformando el chat de texto en una experiencia visual cinematográfica.

---

## **2\. Pilares de Diseño**

### **Pilar Emocional Central:**

*"Sentirse parte de una historia que están creando juntos, expresándose a través de un avatar único en un mundo que responde a sus acciones narrativas."*

### **Pilares Técnicos:**

1. **Libertad Narrativa**

   * Chat especializado con comandos IC (In Character) / OOC (Out Of Character)
   * Separación clara entre diálogo del personaje y conversación entre jugadores
   * Sistema de dados (/roll) para resolución de conflictos

2. **Identidad Visual**

   * Sistema modular de avatares con persistencia JSON (localStorage)
   * Imagen estática por avatar, cargada desde URL local o de internet
   * Cada jugador es visualmente único

3. **Inmersión Interactiva**

   * Objetos del mundo como "portales" a escenas dramáticas
   * Ventana de escenas conjuntas con imagen ilustrada y roles Activo/Pasivo
   * Transiciones fluidas entre exploración y actuación

4. **Comunidad Primero**

   * Arquitectura de Salas en servidor Node.js para sesiones entre amigos
   * Sistema de mods preparado para contenido generado por usuarios
   * Modelo sostenible vía Patreon sin romper la experiencia

---

## **3\. Análisis de Mercado y Referencias**

### **Género: Social Sandbox / Roleplay Platform**

### **Público Objetivo:**

* **Primario:** Adultos jóvenes (18-35) con experiencia en roleplay textual (Discord, foros)
* **Secundario:** Jugadores de MMORPGs que buscan experiencias narrativas casuales

### **Referencias (Inspiración, no copia):**

| Juego | Elemento Inspirador |
| ----- | ----- |
| **Club Penguin** | Salas temáticas, sistema de emotes |
| **Habbo Hotel** | Mobiliario interactivo, salas de usuario |
| **VRChat** | Avatares personalizados, sesiones privadas |
| **Roll20** | Comandos de chat especializados, sistema de dados |
| **GatherTown** | Movimiento en mapa 2D directamente en el navegador |

---

## **4\. Core Loop (Bucle Principal de Juego)**

```
[Personalizar Avatar]
    ↓
[Crear/Unirse a Sala de Rol (vía URL o código)]
    ↓
[Explorar Mapa Top-Down en el navegador]
    ↓
[Interactuar con Objetos/Jugadores]
    ↓
[Participar en Escena Conjunta] ← (Diferenciador único)
    ↓
[Continuar Roleplay en Chat]
    ↓
[Guardar Progreso/Historia en localStorage]
    ↓
(Loop continúa)
```

### **Hooks (Ganchos de Retención):**

* **Expresión Personal:** "Mi avatar es único y representa mi personaje"
* **Progresión Social:** "Cada sesión construye la historia de mi personaje"
* **FOMO de Contenido:** "Quiero las nuevas animaciones/mapas del Patreon"
* **Creación Comunitaria:** "Puedo crear mods y compartirlos"

---

## **5\. Especificaciones Técnicas**

### **5.1. Stack Tecnológico**

| Capa | Tecnología | Justificación |
| ---- | ---------- | ------------- |
| **Motor de juego (cliente)** | Phaser 3 | Motor 2D maduro, corre en navegador, soporte nativo para tilemaps, sprites y física |
| **Servidor de salas** | Node.js + Express | Ligero, mismo lenguaje JS en cliente y servidor, fácil de desplegar |
| **Tiempo real** | Socket.io | Abstracción de WebSockets con salas nativas, reconexión automática |
| **Persistencia local** | JSON + localStorage | Sin base de datos en el MVP; perfiles guardados en el navegador del usuario |
| **Editor de mapas** | Tiled Map Editor | Estándar de la industria, exporta JSON compatible directamente con Phaser |
| **Despliegue** | Railway / Render (plan gratuito) | Servidor Node siempre activo sin costo inicial |

### **5.2. Arquitectura de Datos (JSON)**

#### **CharacterProfile.json**

```json
{
  "profile_id": "unique_uuid",
  "character_name": "Aria Stormwind",
  "backstory": "Una guerrera elfa...",
  "raza_id": "elfo",
  "sexo_id": "femenino",
  "imagen_url": "assets/avatars/elfo_femenino_01.png"
}
```

Los perfiles se guardan en **localStorage** con la clave `rolinchat_profiles`. El campo `imagen_url` acepta rutas locales (assets del juego) o URLs de internet.

#### **RoomConfig (gestionado por el servidor)**

```json
{
  "room_id": "tavern_01",
  "room_name": "La Taberna del Dragón Ebrio",
  "map_key": "tavern",
  "max_players": 8,
  "access_code": "DRAG1234"
}
```

---

### **5.3. Arquitectura de Networking**

**Modelo:** Servidor Node.js + Socket.io con rooms  
**Justificación:** Al ser una app web, no existe un "host" que ejecute un motor de juego local. Un servidor Node.js ligero actúa como intermediario de mensajes (relay), sin necesidad de guardar estado persistente. Puede vivir en la nube de forma gratuita.

#### **Flujo de Conexión:**

```
[Host abre /nueva-sala en el navegador]
    ↓
[Servidor Node.js genera código de 8 caracteres y crea una room de Socket.io]
    ↓
[Host recibe URL compartible: rolinchat.app/sala/DRAG1234]
    ↓
[Clients abren esa URL en su navegador]
    ↓
[Socket.io conecta a cada client a la room correspondiente]
    ↓
[Servidor reenvía estado del mapa y avatares existentes al nuevo cliente]
```

#### **Sincronización (eventos Socket.io):**

* **Posición de avatares:** Evento `player:move` — interpolación en cliente (Phaser tweens)
* **Mensajes de chat:** Evento `chat:message` — validado y retransmitido por servidor
* **Estados de escena:** Evento `scene:state` — servidor es la autoridad, valida y reenvía

#### **Seguridad Básica (MVP):**

```javascript
// server/middleware/rateLimiter.js
const MESSAGE_COOLDOWN_MS = 500;
const lastMessage = new Map(); // socketId -> timestamp

function rateLimitChat(socket, next) {
  const now = Date.now();
  const last = lastMessage.get(socket.id) || 0;
  if (now - last < MESSAGE_COOLDOWN_MS) return; // silently drop
  lastMessage.set(socket.id, now);
  next();
}
```

---

## **6\. Sistemas de Juego (Detallado)**

### **6.1. Creador de Avatares**

#### **Vista en Mapa:**

* **Técnica:** Phaser `Sprite` con la `imagen_url` definida en el JSON del avatar
* **Nametag:** Label HTML/CSS superpuesto al canvas (o `Phaser.GameObjects.Text`)

#### **Ventana de Escenas:**

* **Técnica:** Overlay HTML/CSS sobre el canvas con la imagen de la acción
* No requiere rigging ni animaciones por huesos — las "animaciones" son imágenes pregrabadas

#### **Hoja de Personaje:**

* Panel HTML/CSS superpuesto al canvas
* Visible al hacer clic sobre el avatar de otro jugador
* No afecta gameplay, solo roleplay

---

### **6.2. Sistema de Escenas Conjuntas (El Diferenciador)**

#### **Concepto:**

Transformar objetos del mundo (sofás, mesas de entrenamiento, balcones) en "portales" a escenas dramáticas donde dos jugadores eligen una acción compatible y visualizan una ilustración de la misma.

#### **Archivos de Datos:**

```
public/data/
├── acciones_rol.json    # Todas las acciones disponibles con filtros de compatibilidad
├── razas.json           # Razas disponibles
└── sexos.json           # Sexos disponibles
```

#### **Flujo Técnico (Socket.io):**

```
[Jugador A presiona E en el sofá]
    ↓
socket.emit('scene:request', { objectId, playerId })
    ↓
[Servidor notifica a jugadores cercanos: "¿Unirse a escena?"]
    ↓
[Jugador B acepta → socket.emit('scene:join', { objectId })]
    ↓
[Servidor filtra acciones_rol.json con razas/sexos de ambos avatares]
    ↓
io.to(room).emit('scene:actions_available', { actions: [...] })
    ↓
[Ambos seleccionan acción en UI overlay]
    ↓
io.to(room).emit('scene:start', { action })
    ↓
[Clientes muestran overlay con imagen de la acción]
    ↓
[Cualquiera presiona "Despedirse" → socket.emit('scene:end')]
    ↓
[Servidor notifica, overlay se cierra, ambos regresan al mapa]
```

#### **State Machine en Servidor (SceneManager.js):**

```javascript
const SceneState = {
  WAITING_SECOND_PLAYER: 'waiting',
  SELECTING_ACTION:      'selecting',
  PLAYING:               'playing',
  ENDED:                 'ended'
};
```

---

### **6.3. Chat de Rol Avanzado**

#### **Implementación:**

* Panel HTML/CSS sobre el canvas de Phaser (no usa objetos de Phaser)
* Mensajes renderizados con `innerHTML` sanitizado (DOMPurify)

#### **Comandos Básicos (MVP):**

| Comando | Tipo | Color | Ejemplo | Función |
| ----- | ----- | ----- | ----- | ----- |
| `texto` | IC | Blanco | `Hola, ¿cómo estás?` | Diálogo del personaje |
| `//texto` o `/ooc texto` | OOC | Gris | `//Tengo que salir 5 min` | Charla entre jugadores |
| `/me acción` | Acción | Naranja/Itálica | `/me sonríe pícaramente` | Narración de acciones |
| `/roll XdY` | Dado | Verde | `/roll 1d20` | Genera número aleatorio (1-20) |

#### **Sincronización (Socket.io):**

```javascript
// client/chat.js
function sendMessage(text) {
  socket.emit('chat:message', { text: text.substring(0, 500) });
}

socket.on('chat:message', ({ sender, text }) => {
  const formatted = parseCommand(text, sender);
  appendToLog(formatted);
});

function parseCommand(text, sender) {
  if (text.startsWith('//') || text.startsWith('/ooc')) {
    return `<span class="ooc">(OOC) ${sender}: ${text.replace(/^\/\/|^\/ooc\s*/,'')}</span>`;
  } else if (text.startsWith('/me ')) {
    return `<span class="action">* ${sender} ${text.slice(4)}</span>`;
  } else if (text.startsWith('/roll ')) {
    const result = rollDice(text.slice(6).trim());
    return `<span class="roll">🎲 ${sender} tiró ${text.slice(6).trim()}: ${result}</span>`;
  }
  return `<span class="ic">${sender}: ${text}</span>`;
}
```

---

## **7\. Dirección de Arte e Interfaz**

### **Paleta de Colores:**

* **Primario:** Tonos cálidos (beige, marrón) para UI de pergamino/fantasía
* **Secundario:** Azul oscuro para elementos técnicos (networking, opciones)
* **Acentos:** Dorado para botones principales, rojo para salir/cancelar

### **Estilo Visual:**

* **Mapa:** Pixel art 32x32 base, top-down (Phaser TilemapLayer desde Tiled)
* **Escenas:** Ilustraciones estáticas 800x450px por acción
* **UI:** HTML/CSS puro sobre el canvas; fuentes legibles (mínimo 14px)

### **HUD (Heads-Up Display):**

```
┌─────────────────────────────────────┐
│ [Logo] [Sala: Taberna] [8/8]  [⚙️] │ ← Header HTML/CSS
├─────────────────────────────────────┤
│                                     │
│        [Canvas Phaser 3]            │ ← Área de juego
│        [Mapa Top-Down]              │
│        [Avatares de jugadores]      │
│                                     │
├─────────────────────────────────────┤
│ Chat:                               │
│ Player1: Hola                       │ ← Panel HTML/CSS
│ (OOC) Player2: Qué tal              │
│ * Player1 se sienta                 │
├─────────────────────────────────────┤
│ [Input de texto]          [Enviar]  │ ← Input HTML
└─────────────────────────────────────┘
```

---

## **8\. Alcance del MVP y Roadmap**

### **Definición de MVP (Producto Mínimo Viable):**

*"La versión más simple del producto que permite validar el concepto central con usuarios reales, accesible desde cualquier navegador sin instalación."*

### **Criterios de Éxito del MVP:**

1. ✅ 10 usuarios pueden crear avatares y conectarse vía URL compartida
2. ✅ Pueden chatear en tiempo real con comandos IC/OOC
3. ✅ Pueden participar en 1 animación conjunta y entender el sistema
4. ✅ El juego no crashea en sesiones de 30+ minutos
5. ✅ La experiencia genera interés para seguir el desarrollo (feedback cualitativo)

---

### **Roadmap de Desarrollo (Solo Developer, Tiempo Parcial)**

#### **FASE 1: Core de Conectividad (Semanas 1-4)**

**Objetivo:** Validar que el networking funciona antes de invertir en arte

**Tareas:**

* \[ \] Servidor Node.js + Express + Socket.io
* \[ \] Página HTML de menú principal [Crear Sala / Unirse]
* \[ \] Generación de código de sala (8 caracteres alfanuméricos)
* \[ \] Chat básico funcional (solo texto blanco, sin comandos)
* \[ \] Sincronización de nombres de jugadores
* \[ \] Manejo de desconexiones (sala persiste mientras haya jugadores)

**Criterio de Aceptación:** 2 pestañas del navegador pueden chatear entre sí

---

#### **FASE 2: Identidad (Avatar System) (Semanas 5-9)**

**Objetivo:** Los jugadores pueden crear y ver avatares únicos

**Tareas:**

* \[ \] Interfaz HTML del creador de personajes
* \[ \] Persistencia en localStorage
* \[ \] 4 imágenes de avatar de muestra
* \[ \] Envío de datos de avatar al conectar (Socket.io)
* \[ \] Renderizado del sprite en canvas Phaser 3

**Criterio de Aceptación:** Jugador A ve el avatar de Jugador B en su navegador

---

#### **FASE 3: Mapa Base (Semanas 10-12)**

**Objetivo:** Contexto espacial para el roleplay

**Tareas:**

* \[ \] Diseñar 1 mapa de lobby en Tiled (16x16 tiles mínimo)
* \[ \] Importar tilemap JSON en Phaser 3
* \[ \] Movimiento de avatares (WASD / Flechas)
* \[ \] Colisiones con capa de obstáculos
* \[ \] Sincronización de posición vía Socket.io (con interpolación)
* \[ \] Nametags flotantes (Phaser.GameObjects.Text)

---

#### **FASE 4: Sistema de Escenas (MVP) (Semanas 13-18)**

**Objetivo:** Demostrar el diferenciador clave del juego

**Tareas:**

* \[ \] `acciones_rol.json` con 2 acciones e imágenes
* \[ \] Detección de interacción en objetos del mapa (Phaser overlap / zone)
* \[ \] UI HTML overlay de selección de acciones
* \[ \] Ventana de escena con imagen y botón "Despedirse"
* \[ \] SceneManager.js en servidor (State Machine)
* \[ \] Transición fluida entre mapa y escena

---

#### **FASE 5: Comandos de Chat (Semanas 19-20)**

**Objetivo:** Completar las herramientas narrativas básicas

**Tareas:**

* \[ \] Parsing de comandos: `//`, `/me`, `/roll XdY`
* \[ \] Dados sincronizados (servidor genera número)
* \[ \] Historial de chat (últimos 100 mensajes en memoria del servidor)

---

#### **FASE 6: Pulido y Testing Alfa (Semanas 21-24)**

**Objetivo:** Preparar para feedback externo

**Tareas:**

* \[ \] SFX básicos (Howler.js o Web Audio API)
* \[ \] Spinner / pantalla de carga al conectar
* \[ \] Manejo de errores de conexión (UI amigable)
* \[ \] Tutorial in-game (tooltips)
* \[ \] Despliegue en Railway o Render
* \[ \] Testing con 5-8 usuarios reales
* \[ \] Encuesta de feedback (Google Forms)

---

### **Post-MVP (Backlog Priorizado):**

**Alta Prioridad (para Beta Pública):**

* \[ \] 2 mapas temáticos adicionales (Bosque, Castillo)
* \[ \] 4 acciones conjuntas más
* \[ \] Comandos `/w` (susurro) y `/afk`
* \[ \] "Hoja de Personaje" (inspeccionar avatar)

**Media Prioridad:**

* \[ \] Sistema de mods (carpeta `public/mods/` con estructura estandarizada)
* \[ \] Exportador de logs de roleplay (.txt)

**Baja Prioridad:**

* \[ \] Minijuegos (dados de poker, ajedrez narrativo)
* \[ \] Escenas grupales (3-4 jugadores)
* \[ \] Integración con Discord (Rich Presence)

---

## **9\. Modelo de Monetización y Sostenibilidad**

### **Filosofía:**

*"El contenido central es gratis. Los patrons pagan por influencia en el desarrollo y acceso anticipado."*

### **Tiers de Patreon (Propuesta):**

| Tier | Precio/mes | Beneficios |
| ----- | ----- | ----- |
| **Aprendiz** | $3 | Acceso al Discord exclusivo, rol especial, roadmap interno |
| **Narrador** | $7 | Todo lo anterior + acceso anticipado a builds + voto en encuestas |
| **Leyenda** | $15 | Todo lo anterior + proponer 1 acción conjunta por trimestre + créditos |

### **Objetivos de Financiación (Stretch Goals):**

| Meta | Desbloqueable |
| ----- | ----- |
| **$100/mes** | Nueva sala temática cada 2 meses |
| **$300/mes** | Contratar artista para acelerar ilustraciones |
| **$500/mes** | Servidor dedicado con mejor uptime |
| **$1000/mes** | Desarrollo a tiempo completo |

---

## **10\. Riesgos Técnicos y Mitigación**

| Riesgo | Probabilidad | Impacto | Mitigación |
| ----- | ----- | ----- | ----- |
| **Latencia de Socket.io** | Media | Alto | Interpolación en cliente con Phaser tweens |
| **Servidor caído (plan gratuito)** | Media | Alto | Migrar a plan pago al escalar |
| **Scope creep** | Alta | Crítico | Referirse a este documento, rechazar features fuera de roadmap |
| **Burnout del desarrollador** | Media | Crítico | Sprints de 2 semanas con breaks |
| **Falta de usuarios** | Media | Alto | Marketing en comunidades de roleplay (Reddit, Discord) |
| **Compatibilidad de navegadores** | Baja | Medio | Phaser 3 soporta Chrome, Firefox y Edge modernos |

---

## **11\. Métricas de Éxito (KPIs)**

### **Fase MVP:**

* \[ \] 50 usuarios únicos en el primer mes (analítica con Plausible o GoatCounter)
* \[ \] 10 usuarios activos semanales
* \[ \] Al menos 3 patrons en Patreon
* \[ \] Tasa de retención >30%

### **Fase Beta:**

* \[ \] 200 usuarios únicos totales
* \[ \] 50 usuarios activos semanales
* \[ \] $100/mes en Patreon
* \[ \] Al menos 5 mods creados por la comunidad

---

## **12\. Conclusión y Próximos Pasos**

**RolinChat** es un proyecto ambicioso pero alcanzable con enfoque disciplinado. Al construirse como una **aplicación web**, elimina la barrera de descarga e instalación, reduciendo significativamente la fricción de incorporación de nuevos jugadores. Cualquier persona con un navegador puede unirse con solo abrir un enlace.

### **Decisión Clave:**

El éxito del proyecto depende de **completar la Fase 4** (sistema de escenas) con alta calidad. Si esa fase no genera entusiasmo en testers, el proyecto debe pivotar o reevaluarse.

---

**Versión:** 2.0  
**Última Actualización:** Febrero 2026  
**Estado:** Listo para Desarrollo

---

## **Apéndice: Glosario de Términos**

* **IC (In Character):** Diálogo que el personaje dice en el mundo ficticio
* **OOC (Out Of Character):** Conversación entre jugadores sobre el juego
* **Socket.io Room:** Canal de comunicación aislado para una sala de juego específica
* **Phaser 3:** Motor de juegos 2D HTML5; corre directamente en el navegador
* **Tiled:** Editor visual de mapas por tiles; exporta JSON compatible con Phaser
* **localStorage:** Almacenamiento del navegador para persistir datos sin servidor
* **State Machine:** Sistema que gestiona transiciones entre estados (ej: IDLE → PLAYING → ENDED)
* **Scope Creep:** Crecimiento incontrolado del alcance del proyecto (el enemigo #1)
