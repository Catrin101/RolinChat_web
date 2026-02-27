/**
 * server/index.js
 * Punto de entrada del servidor Node.js + Express + Socket.io
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const RoomManager = require('./managers/RoomManager');
const SceneManager = require('./managers/SceneManager');

const app = express();
app.use(cors());
app.use(express.static('client/public'));
app.use('/src', express.static('client/src'));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware de Rate Limiting muy básico para el chat
const lastMessage = new Map();
const RATE_LIMIT_MS = 500;

function rateLimitChat(socketId) {
    const now = Date.now();
    const last = lastMessage.get(socketId) || 0;
    if (now - last < RATE_LIMIT_MS) return false;
    lastMessage.set(socketId, now);
    return true;
}

io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Crear Sala
    socket.on('room:create', ({ roomName, mapKey, playerName, avatar }) => {
        const code = RoomManager.createRoom(socket.id, roomName, mapKey);
        socket.join(code);

        const room = RoomManager.getRoom(code);
        room.players.set(socket.id, {
            id: socket.id,
            name: playerName || 'Anónimo',
            avatar: avatar || null
        });

        console.log(`Sala creada: ${code} por ${playerName}`);
        socket.emit('room:created', {
            code,
            url: `http://localhost:${PORT}/sala/${code}` // En producción usar URL real
        });
    });

    // Unirse a Sala
    socket.on('room:join', ({ code, playerName, avatar }) => {
        const room = RoomManager.getRoom(code);
        if (!room) {
            socket.emit('room:error', { message: 'Sala no encontrada. Verifica el código.' });
            return;
        }

        const sanitizedName = (playerName || 'Anónimo').substring(0, 30);
        const nameExists = [...room.players.values()].some(p => p.name === sanitizedName);
        const finalName = nameExists ? `${sanitizedName} (${Math.floor(Math.random() * 100)})` : sanitizedName;

        socket.join(code);
        room.players.set(socket.id, {
            id: socket.id,
            name: finalName,
            avatar: avatar || null
        });

        console.log(`Usuario ${finalName} se unió a la sala ${code}`);

        // Notificar al que entra
        socket.emit('room:joined', {
            code,
            name: room.name,
            mapKey: room.mapKey,
            players: [...room.players.values()],
            messages: room.messages // Enviar historial
        });

        // Notificar a los demás
        socket.to(code).emit('player:joined', {
            id: socket.id,
            name: finalName
        });
    });

    // Chat
    socket.on('chat:message', ({ text, type }) => {
        if (!rateLimitChat(socket.id)) return;

        const room = RoomManager.getRoomOfSocket(socket.id);
        if (!room) return;

        const player = room.players.get(socket.id);
        let safeText = String(text).substring(0, 500);
        let finalType = type || 'ic';

        // Lógica de Dados en Servidor
        if (type === 'roll') {
            const rollResult = rollDice(safeText);
            safeText = rollResult;
        }

        const messageData = {
            sender: player.name,
            text: safeText,
            type: finalType
        };

        room.messages.push(messageData);
        if (room.messages.length > 50) room.messages.shift(); // Límite de 50 mensajes

        io.to(room.code).emit('chat:message', messageData);
    });

    /**
     * Helper para tirar dados (ej: 1d20, 2d6+4)
     */
    function rollDice(formula) {
        try {
            const match = formula.toLowerCase().match(/^(\d+)d(\d+)([\+\-]\d+)?$/);
            if (!match) return `Fórmula inválida ${formula}. Usa 1d20 o 2d6+5.`;

            const num = parseInt(match[1]);
            const sides = parseInt(match[2]);
            const mod = match[3] ? parseInt(match[3]) : 0;

            if (num > 20 || sides > 100) return "¡Demasiados dados o caras!";

            let results = [];
            let total = 0;
            for (let i = 0; i < num; i++) {
                const r = Math.floor(Math.random() * sides) + 1;
                results.push(r);
                total += r;
            }
            total += mod;

            return `${num}d${sides}${mod ? (mod > 0 ? '+' + mod : mod) : ''} => (${results.join(' + ')})${mod ? (mod > 0 ? ' + ' + mod : ' - ' + Math.abs(mod)) : ''} = ${total}`;
        } catch (e) {
            return "Error en la tirada.";
        }
    }

    // Movimiento
    socket.on('player:move', ({ x, y }) => {
        const room = RoomManager.getRoomOfSocket(socket.id);
        if (!room) return;

        // Reenviar a los demás en la sala
        socket.to(room.code).emit('player:move', {
            id: socket.id,
            x: x,
            y: y
        });
    });

    // --- Escenas Conjuntas ---

    // Pedir Escena (Host)
    socket.on('scene:request', ({ objectId }) => {
        const room = RoomManager.getRoomOfSocket(socket.id);
        if (!room) return;

        const player = room.players.get(socket.id);
        console.log(`Petición de escena en ${objectId} por ${player.name}`);

        socket.to(room.code).emit('scene:invite', {
            hostId: socket.id,
            hostName: player.name,
            objectId
        });
    });

    // Aceptar Escena (Invitado)
    socket.on('scene:accept', ({ hostId, objectId }) => {
        const room = RoomManager.getRoomOfSocket(socket.id);
        if (!room) return;

        const guest = room.players.get(socket.id);
        const host = room.players.get(hostId);

        if (!host) return;

        // Filtrar acciones compatibles
        const actions = SceneManager.getCompatibleActions(host, guest);

        // Notificar a ambos que la conexión de escena es posible
        io.to(hostId).emit('scene:start_selection', {
            partnerId: socket.id,
            partnerName: guest.name,
            actions
        });
        socket.emit('scene:start_selection', {
            partnerId: hostId,
            partnerName: host.name,
            actions
        });
    });

    // Ejecutar Acción Seleccionada
    socket.on('scene:select_action', ({ partnerId, actionId }) => {
        // En el MVP, el primero que elige manda la imagen a ambos
        const room = RoomManager.getRoomOfSocket(socket.id);
        if (!room) return;

        io.to(socket.id).to(partnerId).emit('scene:play', { actionId });
    });

    // Finalizar Escena
    socket.on('scene:end', ({ partnerId }) => {
        io.to(socket.id).to(partnerId).emit('scene:close');
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        const room = RoomManager.getRoomOfSocket(socket.id);
        if (room) {
            const player = room.players.get(socket.id);
            room.players.delete(socket.id);
            lastMessage.delete(socket.id);

            io.to(room.code).emit('player:left', {
                id: socket.id,
                name: player ? player.name : 'Desconocido'
            });

            if (room.players.size === 0) {
                console.log(`Cerrando sala vacía: ${room.code}`);
                RoomManager.deleteRoom(room.code);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor RolinChat corriendo en http://localhost:${PORT}`);
});
