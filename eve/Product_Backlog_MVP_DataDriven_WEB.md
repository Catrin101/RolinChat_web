# Product Backlog MVP - RolinChat
## Data-Driven Architecture Edition — Web Stack

**Versión:** 1.1 (Ajustado al MVP del Documento Maestro)  
**Metodología:** Scrum adaptado para desarrollo en solitario  
**Duración Estimada:** 4 semanas (tiempo completo) / 8-10 semanas (tiempo parcial)  
**Stack:** Phaser 3 + Node.js + Socket.io  
**Principio Central:** **CODE ONCE, EXPAND FOREVER**

---

## 📐 ARQUITECTURA DATA-DRIVEN

```
┌─────────────────────────────────────────────────────────┐
│  CÓDIGO (escribes UNA VEZ en el MVP)                    │
├─────────────────────────────────────────────────────────┤
│  • AvatarManager.js   (lee JSON, aplica a Sprite)       │
│  • SceneController.js (filtra acciones_rol.json)        │
│  • ChatController.js  (parsea comandos)                 │
│  • SocketManager.js   (cliente Socket.io)               │
│  • server/index.js    (servidor Node.js + Express)      │
│  • server/RoomManager.js (gestiona salas)               │
│  • server/SceneManager.js (state machine escenas)       │
└─────────────────────────────────────────────────────────┘
                        ↓ lee datos de
┌─────────────────────────────────────────────────────────┐
│  CONTENIDO (expandes INFINITAMENTE post-MVP)            │
├─────────────────────────────────────────────────────────┤
│  • avatars/*.json            (nuevos personajes)        │
│  • public/data/razas.json   (+ Orco, Dragón, Ángel...)  │
│  • public/data/sexos.json   (+ No-Binario, Andrógino...)│
│  • public/data/acciones_rol.json (+ 50 escenas nuevas)  │
│  • public/assets/maps/*.json (+ 10 salas temáticas)     │
└─────────────────────────────────────────────────────────┘
```

**Post-MVP: Tú agregas contenido sin tocar código**

---

## 🎯 ÉPICAS DEL PROYECTO

| # | Épica | Objetivo Técnico | Objetivo de Validación |
|---|-------|------------------|------------------------|
| 1 | **CONECTIVIDAD** | Servidor Node.js + Socket.io funcional | "¿Pueden 4 amigos conectarse desde el navegador?" |
| 2 | **IDENTIDAD** | Sistema JSON de avatares + localStorage | "¿La gente quiere personalizar avatares?" |
| 3 | **MUNDO** | Mapa Phaser con movimiento de avatares | "¿Se siente espacial el roleplay?" |
| 4 | **INTERACCIÓN** | Sistema de Escenas Conjuntas + Filtrado | "¿Las escenas conjuntas generan emoción?" |
| 5 | **COMUNICACIÓN** | Chat con comandos especializados | "¿Los comandos /me, /roll mejoran la inmersión?" |

---

## 📅 SPRINT PLAN (4 semanas @ Tiempo Completo)

```
Semana 1: Servidor Node.js + Socket.io + Chat Básico
Semana 2: Sistema de Avatares JSON + localStorage
Semana 3: Mapa Phaser + Movimiento + Filtrado de Acciones
Semana 4: Escenas Conjuntas + Comandos de Chat + Pulido
```

**Milestone Crítico:** Fin de Semana 3 = Demo jugable en el navegador  
**Criterio de Éxito:** Semana 4 = URL pública para 10 testers

---

## 🚀 ÉPICA 1: CONECTIVIDAD (Sprint 1 - Semana 1)

### User Story 1.1: Crear Sala

**Como** JUGADOR HOST  
**Quiero** CREAR UNA SALA con código único  
**Para** QUE mis amigos puedan unirse sin exponer mi IP real

**Criterios de Aceptación:**
- [ ] Botón "Crear Sala" en la página de inicio
- [ ] Se genera código alfanumérico de 8 caracteres
- [ ] El código y la URL compartible se muestran en pantalla
- [ ] El host entra automáticamente al lobby de la sala
- [ ] Funciona en LAN y con el servidor desplegado en la nube

**Tareas de Servidor (server/RoomManager.js):**
```javascript
// server/RoomManager.js
function createRoom(hostSocketId, roomName, mapKey) {
  const code = generateCode(); // 8 chars alfanuméricos
  rooms.set(code, {
    code,
    name: roomName,
    mapKey,
    players: new Map(),
    scenes: new Map()
  });
  return code;
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}
```

**Tareas de Servidor (server/index.js):**
```javascript
io.on('connection', (socket) => {
  socket.on('room:create', ({ roomName, mapKey, playerName }) => {
    const code = RoomManager.createRoom(socket.id, roomName, mapKey);
    socket.join(code);
    socket.emit('room:created', { code, url: `${BASE_URL}/sala/${code}` });
  });
});
```

**Tareas de Cliente (client/ui/MainMenu.js):**
- [ ] Página HTML con botones [Crear Sala] [Unirse]
- [ ] Panel que muestra código + botón "Copiar URL"
- [ ] Redirige automáticamente al lobby tras crear

**Testing:**
- [ ] Crear sala → Código aparece + URL válida
- [ ] Código es único entre ejecuciones
- [ ] Host puede ver el lobby vacío

**Estimación:** 1 día

---

### User Story 1.2: Unirse a Sala

**Como** JUGADOR CLIENT  
**Quiero** UNIRME a una sala usando un código  
**Para** JUGAR con mis amigos

**Criterios de Aceptación:**
- [ ] Input field para ingresar código de 8 caracteres
- [ ] Botón "Conectar" activo solo si el código es válido (formato)
- [ ] Si la sala no existe, muestra error claro
- [ ] Si la conexión es exitosa, entra al lobby con el host

**Tareas de Servidor:**
```javascript
socket.on('room:join', ({ code, playerName }) => {
  const room = RoomManager.getRoom(code);
  if (!room) {
    socket.emit('room:error', { message: 'Sala no encontrada. Verifica el código.' });
    return;
  }
  socket.join(code);
  socket.emit('room:joined', { room: room.getState() });
  io.to(code).emit('player:joined', { id: socket.id, name: playerName });
});
```

**Tareas de Cliente:**
- [ ] Input con validación de formato `[A-Z0-9]{8}`
- [ ] Botón "Unirse" deshabilitado si input vacío
- [ ] Toast de error si sala no existe
- [ ] También funciona abriendo `/sala/CODIGO` directamente

**Testing:**
- [ ] Código inválido → Error
- [ ] Código válido → Conecta al lobby
- [ ] 2 clientes pueden unirse a la misma sala

**Estimación:** 1 día

---

### User Story 1.3: Chat Básico Funcional

**Como** JUGADOR  
**Quiero** ENVIAR MENSAJES de texto  
**Para** COMUNICARME con otros jugadores

**Criterios de Aceptación:**
- [ ] Input de texto en la parte inferior de la pantalla
- [ ] Log de chat muestra mensajes de todos los jugadores
- [ ] Mensajes muestran el nombre del remitente
- [ ] Rate limiting: máximo 1 mensaje cada 500ms
- [ ] Máximo 500 caracteres por mensaje

**Tareas de Servidor:**
```javascript
// server/middleware/rateLimiter.js
const lastMessage = new Map();
function rateLimitChat(socket, next) {
  const now = Date.now();
  if (now - (lastMessage.get(socket.id) || 0) < 500) return;
  lastMessage.set(socket.id, now);
  next();
}

// server/index.js
socket.on('chat:message', ({ text }) => {
  rateLimitChat(socket, () => {
    const safe = String(text).substring(0, 500);
    const room = RoomManager.getRoomOfSocket(socket.id);
    if (!room) return;
    io.to(room.code).emit('chat:message', {
      sender: room.players.get(socket.id)?.name,
      text: safe
    });
  });
});
```

**Tareas de Cliente (client/chat/ChatController.js):**
```javascript
// Sin comandos todavía, solo texto plano
socket.on('chat:message', ({ sender, text }) => {
  appendToLog(`<span class="ic">${sender}: ${escapeHtml(text)}</span>`);
});
```

**Tareas de UI (HTML/CSS):**
- [ ] `<div id="chat-log">` con scroll automático al final
- [ ] `<input id="chat-input">` + `<button>Enviar</button>`
- [ ] Formato: `Nombre: Mensaje` en color blanco

**Testing:**
- [ ] 3 jugadores chateando simultáneamente
- [ ] Spam bloqueado por rate limiting
- [ ] Mensajes largos truncados a 500 chars

**Estimación:** 1 día

---

### User Story 1.4: Manejo de Desconexiones

**Como** SISTEMA  
**Quiero** MANEJAR desconexiones inesperadas  
**Para** NO crashear el servidor ni el cliente

**Criterios de Aceptación:**
- [ ] Si un client se desconecta, los demás ven notificación en chat
- [ ] Si la sala queda vacía, se destruye en memoria del servidor
- [ ] Si el jugador recarga la pestaña, puede reconectarse con el mismo código
- [ ] El sprite del jugador desconectado se elimina del mapa

**Tareas de Servidor:**
```javascript
socket.on('disconnect', () => {
  const room = RoomManager.getRoomOfSocket(socket.id);
  if (!room) return;
  const player = room.players.get(socket.id);
  room.players.delete(socket.id);
  io.to(room.code).emit('player:left', { id: socket.id, name: player?.name });
  if (room.players.size === 0) {
    RoomManager.deleteRoom(room.code);
  }
});
```

**Testing:**
- [ ] Cerrar pestaña → Notificación + sprite eliminado
- [ ] Sala vacía → Destruida en memoria del servidor

**Estimación:** 0.5 días

---

### User Story 1.5: Sincronización de Nombres

**Como** JUGADOR  
**Quiero** VER el nombre de otros jugadores  
**Para** SABER quién es quién

**Criterios de Aceptación:**
- [ ] Al conectar, cada jugador envía su nombre
- [ ] El servidor lo valida (30 chars máx, sin duplicados en la sala)
- [ ] Nombres visibles en el chat

**Tareas de Servidor:**
```javascript
// En room:join handler
function registerPlayerName(room, socketId, name) {
  const sanitized = String(name).substring(0, 30).trim() || 'Anónimo';
  const exists = [...room.players.values()].some(p => p.name === sanitized);
  const finalName = exists ? `${sanitized} (2)` : sanitized;
  room.players.set(socketId, { name: finalName });
  return finalName;
}
```

**Testing:**
- [ ] 3 jugadores con nombres diferentes → OK
- [ ] 2 jugadores con mismo nombre → Segundo recibe sufijo

**Estimación:** 0.5 días

---

**TOTAL SPRINT 1:** 4.5 días → **1 semana con buffer**

**Milestone 1 Alcanzado:** ✅ Servidor Node.js funcional, chat básico operativo en el navegador

---

## 🎨 ÉPICA 2: IDENTIDAD (Sprint 2 - Semana 2)

### User Story 2.1: Estructura de Datos JSON para Avatares

**Como** SISTEMA  
**Quiero** UN FORMATO JSON estandarizado  
**Para** CARGAR avatares de forma consistente

**Criterios de Aceptación:**
- [ ] Clase `AvatarData` puede serializar/deserializar JSON
- [ ] JSON incluye: nombre, descripción, imagen_url, raza_id, sexo_id
- [ ] Validación de campos obligatorios
- [ ] Generación automática de UUID único (client-side)

**Estructura JSON:**
```json
{
  "id": "uuid-generado-automaticamente",
  "nombre": "Aria la Exploradora",
  "descripcion": "Una valiente aventurera que busca tesoros perdidos",
  "imagen_url": "assets/avatars/humano_femenino_01.png",
  "raza_id": "humano",
  "sexo_id": "femenino"
}
```

**Tareas Técnicas (client/avatar/AvatarData.js):**
```javascript
// client/avatar/AvatarData.js
class AvatarData {
  constructor({ nombre, descripcion, imagen_url, raza_id, sexo_id }) {
    this.id = crypto.randomUUID();
    this.nombre = String(nombre).substring(0, 30);
    this.descripcion = String(descripcion).substring(0, 500);
    this.imagen_url = imagen_url;
    this.raza_id = raza_id;
    this.sexo_id = sexo_id;
  }

  toJSON() { return { ...this }; }

  static fromJSON(data) {
    const avatar = Object.create(AvatarData.prototype);
    return Object.assign(avatar, data);
  }

  validate() {
    if (!this.nombre) throw new Error('Nombre es obligatorio');
    if (!this.raza_id) throw new Error('Raza es obligatoria');
    if (!this.sexo_id) throw new Error('Sexo es obligatorio');
    return true;
  }
}
```

**Testing:**
- [ ] Crear avatar → JSON guardado correctamente en localStorage
- [ ] Cargar avatar → Datos correctos
- [ ] JSON incompleto → Error controlado

**Estimación:** 1 día

---

### User Story 2.2: Archivos de Configuración Global

**Como** DISEÑADOR DE CONTENIDO  
**Quiero** ARCHIVOS JSON maestros para razas/sexos  
**Para** AGREGAR opciones sin tocar código

**Criterios de Aceptación:**
- [ ] `public/data/razas.json` lista todas las razas disponibles
- [ ] `public/data/sexos.json` lista todos los sexos disponibles
- [ ] El cliente los descarga al iniciar la app
- [ ] IDs de avatares se validan contra estos archivos

**Estructura de Archivos:**

`public/data/razas.json`:
```json
{
  "razas": [
    { "id": "humano", "nombre": "Humano", "descripcion": "Versátiles y adaptables" },
    { "id": "elfo",   "nombre": "Elfo",   "descripcion": "Ágiles y sabios" },
    { "id": "enano",  "nombre": "Enano",  "descripcion": "Fuertes y resistentes" }
  ]
}
```

`public/data/sexos.json`:
```json
{
  "sexos": [
    { "id": "masculino", "nombre": "Masculino", "icono": "♂" },
    { "id": "femenino",  "nombre": "Femenino",  "icono": "♀" }
  ]
}
```

**Tareas Técnicas (client/config/ConfigLoader.js):**
```javascript
// client/config/ConfigLoader.js
const ConfigLoader = {
  razas: [],
  sexos: [],
  acciones: [],

  async load() {
    const [r, s, a] = await Promise.all([
      fetch('/data/razas.json').then(res => res.json()),
      fetch('/data/sexos.json').then(res => res.json()),
      fetch('/data/acciones_rol.json').then(res => res.json())
    ]);
    this.razas = r.razas;
    this.sexos = s.sexos;
    this.acciones = a.acciones;
  },

  getRaza(id)  { return this.razas.find(r => r.id === id); },
  getSexo(id)  { return this.sexos.find(s => s.id === id); }
};
```

**Testing:**
- [ ] Archivos se cargan al iniciar la app
- [ ] Avatar con raza_id inválido → Error claro

**Estimación:** 1 día

---

### User Story 2.3: Creador de Avatares (UI)

**Como** JUGADOR  
**Quiero** UNA INTERFAZ para crear mi avatar  
**Para** PERSONALIZAR mi personaje

**Criterios de Aceptación:**
- [ ] Input de texto para nombre (máx 30 caracteres)
- [ ] Textarea para descripción (máx 500 caracteres)
- [ ] Selector de imagen (4 opciones prefabricadas mínimo)
- [ ] Selector de raza (poblado desde razas.json)
- [ ] Selector de sexo (poblado desde sexos.json)
- [ ] Preview del avatar en tiempo real
- [ ] Botón "Guardar Perfil"
- [ ] Botón "Cargar Perfil"

**Estructura HTML:**
```html
<!-- avatar-creator.html -->
<div id="avatar-creator">
  <input  id="av-nombre"      maxlength="30"  placeholder="Nombre del personaje" />
  <textarea id="av-desc"      maxlength="500" placeholder="Breve descripción..."></textarea>
  <select id="av-imagen"><!-- opciones de imágenes --></select>
  <select id="av-raza">  <!-- poblado desde razas.json --></select>
  <select id="av-sexo">  <!-- poblado desde sexos.json --></select>
  <img    id="av-preview" src="" alt="Preview" />
  <button id="btn-save">Guardar</button>
  <button id="btn-load">Cargar</button>
  <button id="btn-random">Aleatorio</button>
</div>
```

**Tareas Técnicas (client/avatar/AvatarCreatorUI.js):**
```javascript
document.getElementById('av-imagen').addEventListener('change', (e) => {
  document.getElementById('av-preview').src = e.target.value;
});

document.getElementById('btn-save').addEventListener('click', () => {
  const avatar = new AvatarData({
    nombre:    document.getElementById('av-nombre').value,
    descripcion: document.getElementById('av-desc').value,
    imagen_url: document.getElementById('av-imagen').value,
    raza_id:   document.getElementById('av-raza').value,
    sexo_id:   document.getElementById('av-sexo').value,
  });
  AvatarManager.saveProfile(avatar);
});
```

**Testing:**
- [ ] Crear avatar → Guardado en localStorage
- [ ] Preview se actualiza en tiempo real
- [ ] Aleatorio genera combinación válida

**Estimación:** 2 días

---

### User Story 2.4: Gestión de Múltiples Avatares

**Como** JUGADOR  
**Quiero** CREAR Y GUARDAR múltiples avatares  
**Para** CAMBIAR de personaje según la partida

**Criterios de Aceptación:**
- [ ] Puedo guardar múltiples avatares en localStorage
- [ ] Puedo cargar cualquiera de mis avatares guardados
- [ ] Puedo eliminar avatares con confirmación
- [ ] Lista de avatares en el selector

**Tareas Técnicas (client/avatar/AvatarManager.js):**
```javascript
// client/avatar/AvatarManager.js
const STORAGE_KEY = 'rolinchat_profiles';

const AvatarManager = {
  saveProfile(avatar) {
    const profiles = this.listProfiles();
    profiles[avatar.id] = avatar.toJSON();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  },

  listProfiles() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  },

  loadProfile(id) {
    const profiles = this.listProfiles();
    return profiles[id] ? AvatarData.fromJSON(profiles[id]) : null;
  },

  deleteProfile(id) {
    const profiles = this.listProfiles();
    delete profiles[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  },

  currentAvatar: null
};
```

**Testing:**
- [ ] Crear 3 avatares → 3 entradas en localStorage
- [ ] Cargar avatar 2 → Datos correctos
- [ ] Eliminar avatar 1 → Entrada removida de localStorage

**Estimación:** 1 día

---

### User Story 2.5: Sincronización de Avatares en Red

**Como** JUGADOR  
**Quiero** QUE mi avatar aparezca en pantalla de otros jugadores  
**Para** QUE me reconozcan visualmente

**Criterios de Aceptación:**
- [ ] Al conectar, envío JSON de mi avatar al servidor
- [ ] El servidor reenvía los datos a todos los demás clientes
- [ ] Cada jugador ve los sprites correctos de los demás
- [ ] Los avatares se sincronizan antes de cargar el mapa

**Tareas de Servidor:**
```javascript
socket.on('avatar:register', ({ avatarJson }) => {
  const room = RoomManager.getRoomOfSocket(socket.id);
  if (!room) return;
  room.players.get(socket.id).avatar = avatarJson;
  // Notificar a los demás
  socket.to(room.code).emit('avatar:update', {
    playerId: socket.id,
    avatarJson
  });
  // Enviar avatares existentes al nuevo jugador
  socket.emit('avatar:existing', {
    players: [...room.players.entries()]
      .filter(([id]) => id !== socket.id)
      .map(([id, p]) => ({ id, avatarJson: p.avatar }))
  });
});
```

**Testing:**
- [ ] 3 jugadores con avatares distintos → Todos se ven correctamente

**Estimación:** 1 día

---

**TOTAL SPRINT 2:** 6 días → **1 semana con optimización**

**Milestone 2 Alcanzado:** ✅ Sistema JSON de avatares completo y sincronizado vía Socket.io

---

## 🗺️ ÉPICA 3: MUNDO (Sprint 3 - Semana 3)

### User Story 3.1: Mapa Lobby Básico

**Como** JUGADOR  
**Quiero** UN MAPA VISUAL donde moverme  
**Para** EXPLORAR el espacio de juego

**Criterios de Aceptación:**
- [ ] Mapa top-down de 16x16 tiles mínimo
- [ ] Colisiones con paredes y muebles
- [ ] Al menos 1 objeto interactivo (zona para escenas)
- [ ] Estilo visual coherente (pixel art o tiles flat)

**Tareas de Arte:**
- [ ] Diseñar tileset básico en Tiled:
  - Suelo (2-3 variantes)
  - Pared (esquinas + laterales)
  - Muebles (mesa, silla, sofá)
- [ ] Exportar mapa como `public/assets/maps/lobby.json`

**Tareas Técnicas (client/scenes/GameScene.js — Phaser 3 Scene):**
```javascript
// client/scenes/GameScene.js
class GameScene extends Phaser.Scene {
  preload() {
    this.load.tilemapTiledJSON('lobby', 'assets/maps/lobby.json');
    this.load.image('tiles',    'assets/tilesets/lobby_tiles.png');
  }

  create() {
    const map = this.make.tilemap({ key: 'lobby' });
    const tileset = map.addTilesetImage('lobby_tiles', 'tiles');
    map.createLayer('Suelo',   tileset, 0, 0);
    map.createLayer('Paredes', tileset, 0, 0).setCollisionByExclusion([-1]);
    // Zonas interactivas desde capa de objetos de Tiled
    const objects = map.getObjectLayer('Interactivos').objects;
    // ...
  }
}
```

**Testing:**
- [ ] Mapa se renderiza sin artefactos visuales
- [ ] Capa de colisión bloquea el paso

**Estimación:** 1.5 días (incluye creación de assets)

---

### User Story 3.2: Movimiento de Avatares

**Como** JUGADOR  
**Quiero** MOVER mi avatar con WASD/Flechas  
**Para** NAVEGAR el mapa

**Criterios de Aceptación:**
- [ ] Input: WASD o teclas de flecha
- [ ] Movimiento suave (no teleport)
- [ ] No puedo atravesar paredes (colisiones de Phaser)
- [ ] Mi sprite es la imagen estática definida en mi JSON

**Tareas Técnicas:**
```javascript
// client/entities/PlayerAvatar.js
class PlayerAvatar extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, avatarData, isLocal = false) {
    // Usa avatarData.imagen_url como texture key
    super(scene, x, y, avatarData.id);
    this.isLocal = isLocal;
    this.avatarData = avatarData;
    scene.physics.add.existing(this);
  }

  update(cursors) {
    if (!this.isLocal) return;
    const speed = 150;
    this.setVelocity(0);
    if (cursors.left.isDown  || cursors.a?.isDown) this.setVelocityX(-speed);
    if (cursors.right.isDown || cursors.d?.isDown) this.setVelocityX(+speed);
    if (cursors.up.isDown    || cursors.w?.isDown) this.setVelocityY(-speed);
    if (cursors.down.isDown  || cursors.s?.isDown) this.setVelocityY(+speed);
  }
}
```

**Sincronización de posición:**
```javascript
// Emitir posición local al servidor cada ~50ms (20 fps de red)
setInterval(() => {
  if (localPlayer) {
    socket.emit('player:move', {
      x: localPlayer.x,
      y: localPlayer.y
    });
  }
}, 50);

// Interpolar posición de jugadores remotos
socket.on('player:move', ({ playerId, x, y }) => {
  const remoteAvatar = remotePlayers.get(playerId);
  if (remoteAvatar) {
    scene.tweens.add({ targets: remoteAvatar, x, y, duration: 50 });
  }
});
```

**Testing:**
- [ ] 2 jugadores moviéndose sin lag visible
- [ ] Colisiones previenen atravesar paredes

**Estimación:** 1 día

---

### User Story 3.3: Nametags Flotantes

**Como** JUGADOR  
**Quiero** VER EL NOMBRE de otros jugadores  
**Para** IDENTIFICAR quién es quién

**Criterios de Aceptación:**
- [ ] Label flotante encima de cada avatar
- [ ] Sigue al avatar al moverse
- [ ] Fuente legible (mínimo 12px) con contraste

**Tareas Técnicas:**
```javascript
// En PlayerAvatar — usando Phaser.GameObjects.Text
this.nametag = scene.add.text(x, y - 24, avatarData.nombre, {
  fontSize: '12px',
  color: '#FFFFFF',
  stroke: '#000000',
  strokeThickness: 2
}).setOrigin(0.5, 1);

// Actualizar posición del nametag en update()
update() {
  this.nametag.setPosition(this.x, this.y - 24);
}
```

**Estimación:** 0.5 días

---

### User Story 3.4: Sistema de Filtrado de Acciones

**Como** SISTEMA  
**Quiero** FILTRAR acciones disponibles por raza/sexo  
**Para** MOSTRAR solo interacciones válidas

**Criterios de Aceptación:**
- [ ] `public/data/acciones_rol.json` define combinaciones válidas
- [ ] Al interactuar, el **servidor** filtra y envía acciones compatibles
- [ ] Solo muestra acciones compatibles con ambos jugadores
- [ ] Si no hay acciones compatibles, muestra mensaje informativo

**Estructura de `public/data/acciones_rol.json`:**
```json
{
  "acciones": [
    {
      "id": "charlar_sofa",
      "nombre": "Charlar en el Sofá",
      "combinaciones_sexo": [
        ["masculino", "femenino"],
        ["femenino",  "femenino"],
        ["masculino", "masculino"]
      ],
      "combinaciones_raza": [
        ["humano", "elfo"],
        ["humano", "humano"],
        ["elfo",   "elfo"]
      ],
      "imagen_url": "assets/scenes/charlar_sofa.png"
    }
  ]
}
```

**Tareas de Servidor (server/ActionFilter.js):**
```javascript
// server/ActionFilter.js
const acciones = require('./data/acciones_rol.json').acciones;

function getCompatibleActions(avatar1, avatar2) {
  return acciones.filter(a =>
    isComboValid(a.combinaciones_sexo, avatar1.sexo_id, avatar2.sexo_id) &&
    isComboValid(a.combinaciones_raza, avatar1.raza_id, avatar2.raza_id)
  );
}

function isComboValid(combos, val1, val2) {
  return combos.some(([a, b]) =>
    (a === val1 && b === val2) || (a === val2 && b === val1)
  );
}

module.exports = { getCompatibleActions };
```

**Testing:**
- [ ] Humano M + Elfo F → Muestra "Charlar en el Sofá"
- [ ] Elfo F + Enano M → Sin acciones compatibles → Mensaje claro

**Estimación:** 1.5 días

---

### User Story 3.5: Interacción con Objetos

**Como** JUGADOR  
**Quiero** INTERACTUAR con objetos del mapa  
**Para** INICIAR escenas conjuntas

**Criterios de Aceptación:**
- [ ] Al acercarme al objeto, aparece prompt "Presiona E"
- [ ] Al presionar E: si hay otro jugador cerca → lista de acciones
- [ ] Si no hay nadie → "Necesitas otro jugador cercano"

**Tareas Técnicas (Phaser Zone + Overlap):**
```javascript
// En GameScene.create()
const sofaZone = this.add.zone(sofaX, sofaY, 64, 64);
this.physics.add.existing(sofaZone, true); // static

this.physics.add.overlap(localPlayer, sofaZone, () => {
  promptLabel.setVisible(true);
});

this.input.keyboard.on('keydown-E', () => {
  if (isOverlappingInteractable) {
    const nearbyPlayers = getNearbyPlayers(localPlayer, 80);
    if (nearbyPlayers.length > 0) {
      socket.emit('scene:request', { objectId: 'sofa_main', targetId: nearbyPlayers[0].id });
    } else {
      showMessage('Necesitas otro jugador cercano.');
    }
  }
});
```

**Tareas de UI:**
- [ ] Label "Presiona E" (HTML overlay o Phaser.Text) visible solo al estar cerca
- [ ] Desaparece al alejarse

**Estimación:** 1 día

---

**TOTAL SPRINT 3:** 5.5 días → **1 semana**

**Milestone 3 Alcanzado:** ✅ Mapa funcional en navegador + Sistema de filtrado listo

---

## 🎬 ÉPICA 4: INTERACCIÓN (Sprint 4 - Semana 4, Parte 1)

### User Story 4.1: Selección de Acción

**Como** JUGADOR  
**Quiero** ELEGIR una acción de la lista filtrada  
**Para** INICIAR una escena conjunta

**Criterios de Aceptación:**
- [ ] UI overlay muestra lista de acciones compatibles
- [ ] Cada opción muestra nombre + thumbnail de imagen
- [ ] Requiere que ambos jugadores acepten o uno elija
- [ ] Si alguien cancela, ambos vuelven al mapa

**Tareas de Servidor (server/SceneManager.js):**
```javascript
const SceneState = {
  WAITING_SECOND_PLAYER: 'waiting',
  SELECTING_ACTION:      'selecting',
  PLAYING:               'playing',
  ENDED:                 'ended'
};

socket.on('scene:request', ({ objectId, targetId }) => {
  const room = RoomManager.getRoomOfSocket(socket.id);
  const avatar1 = room.players.get(socket.id).avatar;
  const avatar2 = room.players.get(targetId)?.avatar;
  if (!avatar2) return;

  const actions = ActionFilter.getCompatibleActions(avatar1, avatar2);
  const sceneId = `${objectId}_${socket.id}_${targetId}`;
  room.scenes.set(sceneId, {
    state: SceneState.SELECTING_ACTION,
    players: [socket.id, targetId],
    actions
  });

  io.to(socket.id).to(targetId).emit('scene:actions_available', { sceneId, actions });
});
```

**Tareas de Cliente (client/ui/ActionSelectorUI.js):**
```javascript
socket.on('scene:actions_available', ({ sceneId, actions }) => {
  const panel = document.getElementById('action-selector');
  panel.innerHTML = actions.map(a =>
    `<button onclick="selectAction('${sceneId}', '${a.id}')">
       <img src="${a.imagen_url}" /><span>${a.nombre}</span>
     </button>`
  ).join('') + '<button onclick="cancelScene()">Cancelar</button>';
  panel.style.display = 'flex';
});

function selectAction(sceneId, actionId) {
  socket.emit('scene:select_action', { sceneId, actionId });
}
```

**Estimación:** 1 día

---

### User Story 4.2: Ventana de Escena Conjunta

**Como** JUGADOR  
**Quiero** VER una ventana con la imagen de la acción  
**Para** VISUALIZAR la escena

**Criterios de Aceptación:**
- [ ] Overlay fullscreen con imagen de la acción
- [ ] Imagen cargada desde `imagen_url` del JSON (local o URL)
- [ ] Nombre de la acción visible
- [ ] Botón "Despedirse" para terminar; ambos jugadores regresan al mapa

**Tareas de Servidor:**
```javascript
socket.on('scene:select_action', ({ sceneId, actionId }) => {
  const scene = room.scenes.get(sceneId);
  if (!scene) return;
  const action = scene.actions.find(a => a.id === actionId);
  if (!action) return;

  scene.state = SceneState.PLAYING;
  io.to(scene.players[0]).to(scene.players[1]).emit('scene:start', { action });
});

socket.on('scene:end', ({ sceneId }) => {
  const scene = room.scenes.get(sceneId);
  if (!scene) return;
  scene.state = SceneState.ENDED;
  io.to(scene.players[0]).to(scene.players[1]).emit('scene:ended', { sceneId });
  room.scenes.delete(sceneId);
});
```

**Tareas de Cliente (client/ui/SceneViewerUI.js):**
```javascript
socket.on('scene:start', ({ action }) => {
  document.getElementById('scene-image').src   = action.imagen_url;
  document.getElementById('scene-name').textContent = action.nombre;
  document.getElementById('scene-viewer').style.display = 'flex';
});

function endScene(sceneId) {
  socket.emit('scene:end', { sceneId });
}

socket.on('scene:ended', () => {
  document.getElementById('scene-viewer').style.display = 'none';
});
```

**Estimación:** 1 día

---

### User Story 4.3: Cambio de Avatar en Tiempo Real

**Como** JUGADOR  
**Quiero** CAMBIAR de avatar sin salir de la sala  
**Para** ADAPTAR mi personaje a la narrativa

**Criterios de Aceptación:**
- [ ] Botón "Cambiar Avatar" en menú de opciones (ingame)
- [ ] Abre selector de perfiles guardados en localStorage
- [ ] Al elegir, mi sprite se actualiza en el mapa
- [ ] Todos los jugadores ven el cambio
- [ ] El filtrado de acciones se recalcula automáticamente

**Tareas Técnicas:**
```javascript
// client/ui/AvatarSwitcherUI.js
function switchAvatar(newAvatarId) {
  const avatar = AvatarManager.loadProfile(newAvatarId);
  AvatarManager.currentAvatar = avatar;
  // Actualizar sprite local
  localPlayer.setTexture(avatar.id); // pre-cargar en preload
  localPlayer.nametag.setText(avatar.nombre);
  // Notificar al servidor
  socket.emit('avatar:register', { avatarJson: avatar.toJSON() });
}
```

**Testing:**
- [ ] Cambio de Humano M a Elfo F → Sprite se actualiza para todos
- [ ] Filtrado de acciones se recalcula con la nueva combinación

**Estimación:** 1 día

---

**TOTAL SPRINT 4 (Parte 1):** 3 días

---

## 💬 ÉPICA 5: COMUNICACIÓN (Sprint 4 - Semana 4, Parte 2)

### User Story 5.1: Comandos de Chat Especializados

**Como** JUGADOR  
**Quiero** USAR COMANDOS /me, /roll, //  
**Para** ENRIQUECER mi roleplay

**Criterios de Aceptación:**
- [ ] Texto normal → IC (blanco)
- [ ] `//texto` o `/ooc texto` → OOC (gris)
- [ ] `/me acción` → Acción (naranja itálico)
- [ ] `/roll XdY` → Dado (verde con resultado)

**Tareas Técnicas (client/chat/CommandParser.js):**
```javascript
// client/chat/CommandParser.js
function parseCommand(text, sender) {
  if (text.startsWith('//') || text.startsWith('/ooc ')) {
    const msg = text.replace(/^\/\/|^\/ooc\s*/, '');
    return { type: 'ooc', sender, text: msg };
  }
  if (text.startsWith('/me ')) {
    return { type: 'action', sender, text: text.slice(4) };
  }
  if (text.startsWith('/roll ')) {
    const dice = text.slice(6).trim();
    const result = rollDice(dice);
    return { type: 'roll', sender, dice, result };
  }
  return { type: 'ic', sender, text };
}

function rollDice(notation) {
  const [numStr, sideStr] = notation.split('d');
  const num  = Math.max(1, Math.min(parseInt(numStr) || 1, 20));
  const sides = Math.max(2, Math.min(parseInt(sideStr) || 6, 100));
  let total = 0;
  for (let i = 0; i < num; i++) total += Math.ceil(Math.random() * sides);
  return total;
}
```

**Tareas de Formato (client/chat/MessageFormatter.js):**
```javascript
// client/chat/MessageFormatter.js
function format(parsed) {
  const s = escapeHtml(parsed.sender);
  switch (parsed.type) {
    case 'ic':
      return `<span class="ic"><b>${s}:</b> ${escapeHtml(parsed.text)}</span>`;
    case 'ooc':
      return `<span class="ooc">(OOC) ${s}: ${escapeHtml(parsed.text)}</span>`;
    case 'action':
      return `<span class="action"><i>* ${s} ${escapeHtml(parsed.text)}</i></span>`;
    case 'roll':
      return `<span class="roll">🎲 ${s} tiró ${parsed.dice}: <b>${parsed.result}</b></span>`;
    default:
      return '';
  }
}
```

**Nota:** Los dados se resuelven en el **servidor** para garantizar resultados consistentes en todos los clientes:
```javascript
// server/index.js
socket.on('chat:message', ({ text }) => {
  rateLimitChat(socket, () => {
    const room = RoomManager.getRoomOfSocket(socket.id);
    const player = room.players.get(socket.id);
    let finalText = text.substring(0, 500);
    // Si es /roll, calcular en servidor
    if (text.startsWith('/roll ')) {
      const dice = text.slice(6).trim();
      const result = rollDice(dice);
      finalText = `/roll_result ${dice} ${result}`;
    }
    io.to(room.code).emit('chat:message', { sender: player.name, text: finalText });
  });
});
```

**Testing:**
- [ ] Texto normal → Blanco en todos los clientes
- [ ] `//Hola` → Gris con (OOC)
- [ ] `/me sonríe` → Naranja itálico
- [ ] `/roll 1d20` → Verde con resultado consistente en todos

**Estimación:** 1 día

---

**TOTAL SPRINT 4 (Completo):** 4 días → **1 semana con pulido**

---

## 🎨 FASE 6: PULIDO Y TESTING (Integrado en Sprint 4)

### Tareas de Pulido

- [ ] **Sonido** (Howler.js):
  - Click de botón (UI)
  - Sonido de mensaje nuevo en chat
  - Música ambiente para lobby (loop de 1-2 min)

- [ ] **UI/UX:**
  - Tooltips en botones importantes
  - Spinner de carga al conectar
  - Mensajes de error claros (toast notifications)
  - Responsive básico (mínimo 1024px de ancho)

- [ ] **Optimización:**
  - Reducir lag en sincronización de movimiento (throttle a 20fps de red)
  - Limitar historial de chat a 100 mensajes en DOM

- [ ] **Despliegue:**
  - Subir a Railway o Render (plan gratuito)
  - Variable de entorno `BASE_URL` para la URL pública
  - Probar con jugadores en distintas ciudades

**Estimación:** Integrado en el desarrollo, ~4 horas al final

---

## ✅ DEFINITION OF DONE (DoD)

Una tarea está **DONE** cuando:
- [ ] Código implementado y funcional
- [ ] Testing manual completado (checklist)
- [ ] Sin errores en consola del navegador ni en Node.js
- [ ] Documentado con comentarios (si es complejo)
- [ ] Integrado con sistemas existentes
- [ ] Probado con 2+ pestañas abiertas (si es networking)
- [ ] Agregado a checklist de testing final

---

## 🧪 CHECKLIST DE TESTING FINAL

### Pre-Launch Testing (Semana 4, último día)

- [ ] **Networking (Socket.io):**
  - [ ] 4 jugadores pueden conectarse simultáneamente desde distintas pestañas
  - [ ] Chat funciona con 4 jugadores
  - [ ] Desconexión maneja correctamente (sprite eliminado, sala no crashea)

- [ ] **Avatares:**
  - [ ] 4 avatares distintos se ven correctamente en todos los clientes
  - [ ] Cambio de avatar en tiempo real funciona
  - [ ] Filtrado de acciones es correcto según raza/sexo

- [ ] **Mapa (Phaser 3):**
  - [ ] Colisiones funcionan
  - [ ] Movimiento fluido sin lag visible
  - [ ] Nametags legibles

- [ ] **Escenas:**
  - [ ] 2 acciones distintas son ejecutables
  - [ ] Imágenes se cargan (local y URL externa)
  - [ ] "Despedirse" devuelve a ambos al mapa

- [ ] **Chat:**
  - [ ] Todos los comandos funcionan en todos los clientes
  - [ ] Rate limiting previene spam
  - [ ] DOM no excede 100 mensajes visibles

- [ ] **Estabilidad:**
  - [ ] 30 minutos de juego sin crashes del servidor
  - [ ] Sin errores en consola del navegador
  - [ ] FPS estable (60+) en Chrome y Firefox

---

## 📊 CRITERIOS DE ÉXITO DEL MVP

### Métricas de Validación

1. **Técnicas:**
   - [ ] URL pública accesible sin instalación
   - [ ] 0 crashes del servidor en sesiones de 30+ minutos
   - [ ] 4 jugadores simultáneos sin lag visible

2. **Experiencia:**
   - [ ] 10 usuarios pueden crear avatares y conectarse vía URL
   - [ ] Entienden el sistema de filtrado de acciones
   - [ ] Completan al menos 1 escena conjunta

3. **Feedback:**
   - [ ] Al menos 5/10 testers dicen "Seguiría jugando esto"
   - [ ] 3/10 testers mencionan features que quieren ver

---

## 🚀 POST-MVP: EXPANSIÓN SIN CÓDIGO

Una vez completado el MVP, puedes expandir el juego **SIN TOCAR CÓDIGO**:

### Agregar Nuevas Razas

```json
// public/data/razas.json — solo editar este archivo
{
  "razas": [
    // ... razas existentes ...
    {
      "id": "dragon",
      "nombre": "Dragón",
      "descripcion": "Poderosos y majestuosos"
    }
  ]
}
```

### Agregar Nuevas Acciones

```json
// public/data/acciones_rol.json
{
  "acciones": [
    // ... acciones existentes ...
    {
      "id": "volar_juntos",
      "nombre": "Volar Juntos",
      "combinaciones_sexo": [["masculino", "femenino"]],
      "combinaciones_raza": [["dragon", "humano"]],
      "imagen_url": "assets/scenes/volar.png"
    }
  ]
}
```

### Agregar Nuevos Mapas

1. Diseñar mapa en Tiled
2. Exportar como `public/assets/maps/taberna.json`
3. Agregar entrada en la lista de mapas disponibles en `public/data/maps.json`
4. Listo ✅ — el motor lo cargará automáticamente

---

## 📁 ESTRUCTURA DE PROYECTO

```
rolinchat/
├── server/
│   ├── index.js           # Servidor Express + Socket.io
│   ├── RoomManager.js     # Gestión de salas
│   ├── SceneManager.js    # State machine de escenas
│   ├── ActionFilter.js    # Filtrado de acciones compatibles
│   └── middleware/
│       └── rateLimiter.js
├── public/
│   ├── index.html         # Menú principal
│   ├── game.html          # Pantalla de juego
│   ├── data/
│   │   ├── razas.json
│   │   ├── sexos.json
│   │   └── acciones_rol.json
│   ├── assets/
│   │   ├── maps/          # Tilemaps de Tiled (.json)
│   │   ├── tilesets/      # Imágenes de tiles
│   │   ├── avatars/       # Sprites de avatares
│   │   └── scenes/        # Imágenes de acciones
│   └── client/
│       ├── main.js        # Entry point (carga Phaser)
│       ├── scenes/
│       │   ├── MainMenuScene.js
│       │   └── GameScene.js
│       ├── entities/
│       │   └── PlayerAvatar.js
│       ├── avatar/
│       │   ├── AvatarData.js
│       │   ├── AvatarManager.js
│       │   └── AvatarCreatorUI.js
│       ├── chat/
│       │   ├── ChatController.js
│       │   ├── CommandParser.js
│       │   └── MessageFormatter.js
│       ├── ui/
│       │   ├── ActionSelectorUI.js
│       │   ├── SceneViewerUI.js
│       │   └── AvatarSwitcherUI.js
│       └── config/
│           └── ConfigLoader.js
├── package.json
└── README.md
```

---

## 📈 ROADMAP POST-MVP

### Alta Prioridad (Post-MVP Inmediato)
- [ ] 2 mapas adicionales (Taberna, Bosque)
- [ ] 5 acciones conjuntas más
- [ ] Comando `/w` (susurro privado)
- [ ] Sistema de "Hoja de Personaje" (panel de inspección)

### Media Prioridad (v0.2)
- [ ] Exportador de logs de chat (.txt)
- [ ] Sistema de mods (`public/mods/` con estructura documentada)
- [ ] Minijuegos (ajedrez, dados de poker)

### Baja Prioridad (v0.3+)
- [ ] Escenas grupales (3+ jugadores)
- [ ] Sistema de achievements
- [ ] Integración con Discord (Rich Presence vía URL scheme)

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Latencia de Socket.io** | Media | Alto | Interpolación client-side con Phaser tweens |
| **Servidor gratuito con downtime** | Media | Alto | Migrar a plan pago al escalar; Railway tiene uptime razonable |
| **Scope Creep** | Alta | Crítico | Referirse a este backlog, rechazar features |
| **Arte toma demasiado tiempo** | Alta | Medio | Usar assets de OpenGameArt como placeholder |
| **Burnout** | Media | Alto | Sprints de 1 semana con descansos |
| **Filtrado de acciones buggy** | Media | Medio | Tests unitarios para ActionFilter.js con Node's test runner |

---

## 📝 NOTAS FINALES

### Principios de Desarrollo

1. **Completar > Perfeccionar:** Un sistema funcional en el navegador es mejor que uno perfecto sin terminar
2. **Testing Temprano:** Probar Socket.io ANTES de invertir en arte
3. **Data-Driven:** Si algo puede ser JSON, que sea JSON
4. **Scope Controlado:** Solo lo del backlog, nada más

### Próximos Documentos Necesarios

1. **Arquitectura de Sistemas** — Diagrama de eventos Socket.io (cliente ↔ servidor)
2. **Guía de Assets** — Especificaciones de sprites, tilemaps y paleta de colores
3. **Manual de Despliegue** — Cómo subir el servidor a Railway/Render paso a paso

---

**ESTE BACKLOG ES TU BIBLIA DE DESARROLLO**

No agregues features que no estén aquí.  
No te saltes sprints.  
Cada fase valida que la anterior funciona.

---

**Versión:** 1.1  
**Última Actualización:** Febrero 2026  
**Estado:** ✅ Listo para Implementación

---

**FIN DEL PRODUCT BACKLOG MVP**
