/**
 * client/src/scenes/GameScene.js
 * Escena principal de juego en Phaser 3.
 */

import { PlayerEntity } from '../entities/PlayerEntity.js';

const WORLD_W = 2400;
const WORLD_H = 1800;

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.localPlayer = null;
        this.remotePlayers = new Map();
        this.interactiveObjects = [];
        this.interactionPrompt = null;
        this.socket = null;
        this.localTextureKey = 'placeholder_avatar';
    }

    init(data) {
        this.socket = data.socket;
        this.roomData = data.roomData;
        this.initialPlayerData = data.playerData;
    }

    preload() {
        // Siempre cargamos el placeholder como fallback
        this.load.image('placeholder_avatar', 'https://placehold.co/32x48/d4af37/black?text=P');

        // Intentar cargar la imagen del avatar del jugador local
        const avatarUrl = this.initialPlayerData?.imagen_url;
        if (avatarUrl) {
            this.localTextureKey = `avatar_local_${this.initialPlayerData?.id || 'player'}`;
            this.load.image(this.localTextureKey, avatarUrl);

            // Si falla la carga, volver al placeholder
            this.load.on('loaderror', (file) => {
                if (file.key === this.localTextureKey) {
                    this.localTextureKey = 'placeholder_avatar';
                }
            });
        }
    }

    create() {
        // Grid del mundo completo
        this.add.grid(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 32, 32, 0x050505, 1, 0x111111);

        // Límites del mundo físico
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

        // Asegurarse que la textura existe, si no usar placeholder
        const finalTextureKey = this.textures.exists(this.localTextureKey)
            ? this.localTextureKey
            : 'placeholder_avatar';

        // Crear Jugador Local en el centro del mundo
        this.localPlayer = new PlayerEntity(
            this,
            WORLD_W / 2,
            WORLD_H / 2,
            this.initialPlayerData,
            true,
            finalTextureKey
        );

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
        this.addInteractionZone(400, 350, 100, 60, 'Sofa de Terciopelo');
        this.addInteractionZone(900, 700, 80, 80, 'Mesa Redonda');

        this.setupSocketEvents();

        // ✅ CÁMARA SIGUE AL JUGADOR con lerp suave
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);

        // Tecla E para interactuar
        this.input.keyboard.on('keydown-E', () => {
            if (this.isInputFocused()) return;
            this.handleInteraction();
        });

        // Zoom con rueda del ratón
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomSpeed = 0.001;
            const oldZoom = this.cameras.main.zoom;
            const newZoom = Phaser.Math.Clamp(oldZoom - deltaY * zoomSpeed, 0.5, 4);
            this.cameras.main.setZoom(newZoom);
        });

        // Prompt de interacción (setScrollFactor(0) para que no se mueva con la cámara)
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
            this.localPlayer.body.setVelocity(0);
        }

        this.remotePlayers.forEach(player => player.update());
    }

    updateInteractionPrompt() {
        let nearObject = null;
        this.interactiveObjects.forEach(obj => {
            const dist = Phaser.Math.Distance.Between(
                this.localPlayer.x, this.localPlayer.y, obj.x, obj.y
            );
            if (dist < 80) nearObject = obj;
        });

        if (nearObject) {
            this.interactionPrompt.setPosition(nearObject.x, nearObject.y - 50);
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
        }
    }

    setupSocketEvents() {
        this.socket.on('player:joined', (playerData) => {
            this.addRemotePlayer(playerData);
        });

        this.socket.on('player:move', ({ id, x, y }) => {
            const player = this.remotePlayers.get(id);
            if (player) {
                this.tweens.add({
                    targets: player,
                    x: x,
                    y: y,
                    duration: 50
                });
            }
        });

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

        // Para jugadores remotos: intentar cargar su imagen si viene en el avatar
        const remoteAvatarUrl = playerData.avatar?.imagen_url;
        const remoteTextureKey = `avatar_remote_${playerData.id}`;

        if (remoteAvatarUrl && !this.textures.exists(remoteTextureKey)) {
            // Cargar imagen remota en caliente
            this.load.image(remoteTextureKey, remoteAvatarUrl);
            this.load.once('complete', () => {
                this._spawnRemotePlayer(playerData, remoteTextureKey);
            });
            this.load.start();
        } else {
            const tex = this.textures.exists(remoteTextureKey) ? remoteTextureKey : 'placeholder_avatar';
            this._spawnRemotePlayer(playerData, tex);
        }
    }

    _spawnRemotePlayer(playerData, textureKey) {
        if (this.remotePlayers.has(playerData.id)) return;
        const remotePlayer = new PlayerEntity(
            this,
            playerData.x || WORLD_W / 2,
            playerData.y || WORLD_H / 2,
            playerData,
            false,
            textureKey
        );
        this.remotePlayers.set(playerData.id, remotePlayer);
    }

    addInteractionZone(x, y, w, h, name) {
        const zone = this.add.zone(x, y, w, h);
        this.physics.add.existing(zone, true);
        zone.name = name;
        this.interactiveObjects.push(zone);

        // Visual para MVP
        this.add.rectangle(x, y, w, h, 0x333333, 0.5).setStrokeStyle(1, 0xaaaaaa);
        this.add.text(x, y, name, { fontSize: '10px', color: '#888' }).setOrigin(0.5);
    }

    handleInteraction() {
        if (!this.localPlayer) return;

        let nearObject = null;
        this.interactiveObjects.forEach(obj => {
            const dist = Phaser.Math.Distance.Between(
                this.localPlayer.x, this.localPlayer.y, obj.x, obj.y
            );
            if (dist < 80) nearObject = obj;
        });

        if (!nearObject) return;

        let nearPlayer = null;
        this.remotePlayers.forEach((player, id) => {
            const dist = Phaser.Math.Distance.Between(
                this.localPlayer.x, this.localPlayer.y, player.x, player.y
            );
            if (dist < 100) nearPlayer = { id, name: player.playerData.name };
        });

        if (nearPlayer) {
            this.socket.emit('scene:request', {
                objectId: nearObject.name,
                partnerId: nearPlayer.id
            });
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
