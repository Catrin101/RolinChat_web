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
        this.interactiveObjects = [];
        this.interactionPrompt = null;
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
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');

        // Objetos Interactivos Provisionales (para MVP)
        // Sofá
        this.addInteractionZone(200, 200, 100, 60, 'Sofa de Terciopelo');
        // Mesa
        this.addInteractionZone(600, 400, 80, 80, 'Mesa Redonda');

        this.setupSocketEvents();

        // Cámara sigue al jugador
        this.cameras.main.setZoom(1);

        // Tecla E para interactuar
        this.input.keyboard.on('keydown-E', () => {
            if (this.isInputFocused()) return;
            this.handleInteraction();
        });

        // Zoom de cámara (Rueda del ratón)
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomSpeed = 0.001;
            const oldZoom = this.cameras.main.zoom;
            const newZoom = Phaser.Math.Clamp(oldZoom - deltaY * zoomSpeed, 0.5, 4);

            this.cameras.main.setZoom(newZoom);
        });

        // Prompt de interacción
        this.interactionPrompt = this.add.text(0, 0, '[E] Interactuar', {
            fontSize: '14px',
            backgroundColor: '#d4af37',
            color: '#000',
            padding: { x: 5, y: 2 },
            borderRadius: 4
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        // Timer para enviar posición (20 veces por segundo)
        this.time.addEvent({
            delay: 50,
            callback: this.emitPosition,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.localPlayer && !this.isInputFocused()) {
            this.localPlayer.update({ ...this.cursors, ...this.keys });
            this.updateInteractionPrompt();
        } else if (this.localPlayer) {
            // Si el input está enfocado, detener al jugador
            this.localPlayer.body.setVelocity(0);
        }

        // Actualizar jugadores remotos para que sus nametags sigan al sprite
        this.remotePlayers.forEach(player => player.update());
    }

    updateInteractionPrompt() {
        let nearObject = null;
        this.interactiveObjects.forEach(obj => {
            const dist = Phaser.Math.Distance.Between(this.localPlayer.x, this.localPlayer.y, obj.x, obj.y);
            if (dist < 80) nearObject = obj;
        });

        if (nearObject) {
            this.interactionPrompt.setPosition(nearObject.x, nearObject.y - 40);
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
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

    addInteractionZone(x, y, w, h, name) {
        const zone = this.add.zone(x, y, w, h);
        this.physics.add.existing(zone, true);
        zone.name = name;
        this.interactiveObjects.push(zone);

        // Visual para debug/MVP
        this.add.rectangle(x, y, w, h, 0x333333, 0.5).setStrokeStyle(1, 0xaaaaaa);
        this.add.text(x, y, name, { fontSize: '10px', color: '#888' }).setOrigin(0.5);
    }

    handleInteraction() {
        if (!this.localPlayer) return;

        // 1. Buscar objeto cercano
        let nearObject = null;
        this.interactiveObjects.forEach(obj => {
            const dist = Phaser.Math.Distance.Between(this.localPlayer.x, this.localPlayer.y, obj.x, obj.y);
            if (dist < 80) nearObject = obj;
        });

        if (!nearObject) return;

        // 2. Buscar jugador cercano
        let nearPlayer = null;
        this.remotePlayers.forEach((player, id) => {
            const dist = Phaser.Math.Distance.Between(this.localPlayer.x, this.localPlayer.y, player.x, player.y);
            if (dist < 100) nearPlayer = { id, name: player.playerData.name };
        });

        if (nearPlayer) {
            console.log(`Invitando a ${nearPlayer.name} a escena en ${nearObject.name}`);
            this.socket.emit('scene:request', {
                objectId: nearObject.name,
                partnerId: nearPlayer.id
            });
            // Mostrar estado de espera
            this.events.emit('ui:message', `Has invitado a ${nearPlayer.name} a ${nearObject.name}...`);
        } else {
            this.events.emit('ui:message', `Necesitas a alguien cerca para usar el ${nearObject.name}.`);
        }
    }

    isInputFocused() {
        return document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA';
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
