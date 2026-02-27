/**
 * server/managers/SceneManager.js
 * Gestiona el estado de las escenas conjuntas y la lógica de invitación.
 */

const accionesRol = require('../../client/public/data/acciones_rol.json');

class SceneManager {
    constructor() {
        this.activeScenes = new Map(); // roomId -> { sceneId: { players: [], state, actionId } }
    }

    /**
     * Inicia una petición de escena.
     */
    requestScene(socket, { objectId, playerId, roomCode }) {
        // En un MVP simplificado, buscamos si hay alguien cerca en el servidor
        // O simplemente enviamos la invitación a todos en la sala y el primero que acepte se une.
        // Para este MVP: El servidor retransmite la invitación.

        socket.to(roomCode).emit('scene:invite', {
            hostId: socket.id,
            hostName: playerId, // Nombre del personaje o player
            objectId
        });
    }

    /**
     * Filtra las acciones compatibles entre dos jugadores.
     */
    getCompatibleActions(player1, player2) {
        if (!player1.avatar || !player2.avatar) return [];

        return accionesRol.acciones.filter(accion => {
            const sexoValido = this._checkCombination(
                accion.combinaciones_sexo,
                player1.avatar.sexo_id,
                player2.avatar.sexo_id
            );
            const razaValida = this._checkCombination(
                accion.combinaciones_raza,
                player1.avatar.raza_id,
                player2.avatar.raza_id
            );
            return sexoValido && razaValida;
        });
    }

    _checkCombination(combinations, val1, val2) {
        return combinations.some(([c1, c2]) =>
            (c1 === val1 && c2 === val2) || (c1 === val2 && c2 === val1)
        );
    }
}

module.exports = new SceneManager();
