/**
 * client/src/scenes/GameScene.js
 * Escena principal de juego en Phaser 3.
 */

import { PlayerEntity } from '../entities/PlayerEntity.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.localPlayer = null;
        this.remotePlayers = new Map();
        this.socket = null;
    }

    init(data) {
        this.socket = data.socket;
        this.roomData = data.roomData; // { code, players, mapKey }
        this.initialPlayerData = data.playerData;
    }

    preload() {
        // Carga de placeholders
        this.load.image('placeholder_avatar', 'https://placehold.co/32x48/d4af37/black?text=P');
        this.load.image('tiles', 'https://placehold.co/32x32/1a1a1a/ffffff?text=+');

        // En el futuro aquí cargaremos el JSON de Tiled
        // this.load.tilemapTiledJSON('lobby', 'assets/maps/lobby.json');
    }

    create() {
        // Por ahora creamos un "mundo" vacío con grid decimal
        this.add.grid(400, 300, 800, 600, 32, 32, 0x050505, 1, 0x111111);

        // Crear Jugador Local
        this.localPlayer = new PlayerEntity(this, 400, 300, this.initialPlayerData, true);

        // Crear Jugadores Remotos ya presentes
        this.roomData.players.forEach(p => {
            if (p.id !== this.socket.id) {
                this.addRemotePlayer(p);
            }
        });

        // Configurar Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

        this.setupSocketEvents();

        // Timer para enviar posición (20 veces por segundo)
        this.time.addEvent({
            delay: 50,
            callback: this.emitPosition,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.localPlayer) {
            this.localPlayer.update({ ...this.cursors, ...this.keys });
        }
    }

    setupSocketEvents() {
        // Nuevo jugador entra
        this.socket.on('player:joined', (playerData) => {
            this.addRemotePlayer(playerData);
        });

        // Jugador se mueve
        this.socket.on('player:move', ({ id, x, y }) => {
            const player = this.remotePlayers.get(id);
            if (player) {
                // Interpolación suave
                this.tweens.add({
                    targets: player,
                    x: x,
                    y: y,
                    duration: 50
                });
            }
        });

        // Jugador sale
        this.socket.on('player:left', ({ id }) => {
            const player = this.remotePlayers.get(id);
            if (player) {
                player.destroy();
                this.remotePlayers.delete(id);
            }
        });
    }

    addRemotePlayer(playerData) {
        if (this.remotePlayers.has(playerData.id)) return;

        const remotePlayer = new PlayerEntity(this, 400, 300, playerData, false);
        this.remotePlayers.set(playerData.id, remotePlayer);
    }

    emitPosition() {
        if (this.localPlayer && this.socket) {
            this.socket.emit('player:move', {
                x: this.localPlayer.x,
                y: this.localPlayer.y
            });
        }
    }
}
