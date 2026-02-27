/**
 * client/src/managers/GameManager.js
 * Orquestador de Phaser y puente con Socket.io.
 */

import { GameScene } from '../scenes/GameScene.js';

class GameManager {
    constructor() {
        this.game = null;
        this.socket = null;
    }

    /**
     * Inicializa la instancia de Phaser.
     * @param {Object} socket - Instancia de Socket.io
     * @param {Object} roomData - Datos de la sala al conectar
     * @param {Object} playerData - Datos del jugador local (avatar incluido)
     */
    init(socket, roomData, playerData) {
        this.socket = socket;

        const config = {
            type: Phaser.AUTO,
            parent: 'phaser-container',
            width: 800,
            height: 600,
            pixelArt: true,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: GameScene
        };

        this.game = new Phaser.Game(config);

        // Pasar datos a la escena cuando esté lista
        this.game.scene.start('GameScene', {
            socket: this.socket,
            roomData: this.roomData || roomData,
            playerData: playerData
        });
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}

export const gameManager = new GameManager();
