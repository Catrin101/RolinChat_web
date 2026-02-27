/**
 * server/managers/RoomManager.js
 * Gestiona la creación, recuperación y eliminación de salas.
 */

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    /**
     * Crea una nueva sala con un código único.
     * @param {string} hostSocketId - ID del socket del host.
     * @param {string} roomName - Nombre de la sala.
     * @param {string} mapKey - ID del mapa a usar.
     * @returns {string} El código de 8 caracteres generado.
     */
    createRoom(hostSocketId, roomName, mapKey) {
        const code = this._generateCode();
        this.rooms.set(code, {
            code,
            name: roomName || 'Sala de Rol',
            mapKey: mapKey || 'lobby',
            players: new Map(),
            scenes: new Map(),
            createdAt: Date.now()
        });
        return code;
    }

    /**
     * Obtiene una sala por su código.
     * @param {string} code - Código de la sala.
     * @returns {Object|null}
     */
    getRoom(code) {
        return this.rooms.get(code) || null;
    }

    /**
     * Busca la sala a la que pertenece un socket.
     * @param {string} socketId 
     * @returns {Object|null}
     */
    getRoomOfSocket(socketId) {
        for (const room of this.rooms.values()) {
            if (room.players.has(socketId)) {
                return room;
            }
        }
        return null;
    }

    /**
     * Elimina una sala.
     * @param {string} code 
     */
    deleteRoom(code) {
        this.rooms.delete(code);
    }

    /**
     * Genera un código alfanumérico aleatorio de 8 caracteres.
     * @private
     */
    _generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        do {
            code = Array.from({ length: 8 }, () =>
                chars[Math.floor(Math.random() * chars.length)]
            ).join('');
        } while (this.rooms.has(code));
        return code;
    }
}

module.exports = new RoomManager();
