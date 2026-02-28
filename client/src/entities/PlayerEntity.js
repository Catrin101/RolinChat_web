/**
 * client/src/entities/PlayerEntity.js
 * Representación en Phaser de un jugador (Local o Remoto).
 */

export class PlayerEntity extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {Object} playerData - { id, name, avatar }
     * @param {boolean} isLocal
     * @param {string} textureKey - Clave de textura ya cargada en Phaser
     */
    constructor(scene, x, y, playerData, isLocal = false, textureKey = 'placeholder_avatar') {
        super(scene, x, y, textureKey);

        this.scene = scene;
        this.playerData = playerData;
        this.isLocal = isLocal;

        // Añadir a la escena y física
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setImmovable(!isLocal);

        // Escalar el sprite a 32x48 para consistencia visual
        this.setDisplaySize(32, 48);

        // Nametag encima del sprite
        const label = playerData.avatar?.nombre || playerData.name || 'Jugador';
        this.nametag = scene.add.text(x, y - 32, label, {
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        // Cuerpo de colisión ajustado
        this.body.setSize(28, 36);
        this.body.setOffset(2, 12);
    }

    update(cursors) {
        if (!this.isLocal) {
            // Solo actualizar nametag en remotos
            this.nametag.setPosition(this.x, this.y - 32);
            return;
        }

        const speed = 160;
        this.body.setVelocity(0);

        // Movimiento horizontal
        if (cursors.left?.isDown || cursors.A?.isDown) {
            this.body.setVelocityX(-speed);
        } else if (cursors.right?.isDown || cursors.D?.isDown) {
            this.body.setVelocityX(speed);
        }

        // Movimiento vertical
        if (cursors.up?.isDown || cursors.W?.isDown) {
            this.body.setVelocityY(-speed);
        } else if (cursors.down?.isDown || cursors.S?.isDown) {
            this.body.setVelocityY(speed);
        }

        // Normalizar velocidad diagonal
        if (this.body.velocity.length() > 0) {
            this.body.velocity.normalize().scale(speed);
        }

        // Actualizar nametag
        this.nametag.setPosition(this.x, this.y - 32);
    }

    destroy() {
        if (this.nametag) this.nametag.destroy();
        super.destroy();
    }
}
