/**
 * client/src/entities/PlayerEntity.js
 * Representación en Phaser de un jugador (Local o Remoto).
 */

export class PlayerEntity extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, playerData, isLocal = false) {
        // Usamos una textura temporal si no hay imagen_url válida
        const texture = playerData.avatar?.id || 'placeholder_avatar';
        super(scene, x, y, texture);

        this.scene = scene;
        this.playerData = playerData; // { id, name, avatar }
        this.isLocal = isLocal;

        // Añadir a la escena
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setImmovable(!isLocal);

        // Crear Nametag
        this.nametag = scene.add.text(x, y - 40, playerData.avatar?.nombre || playerData.name, {
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Ajustar tamaño de colisión
        this.body.setSize(32, 32);
        this.body.setOffset(0, 16);
    }

    update(cursors) {
        if (!this.isLocal) {
            // Actualizar posición del nametag para remotos
            this.nametag.setPosition(this.x, this.y - 40);
            return;
        }

        const speed = 160;
        this.body.setVelocity(0);

        // Movimiento Horizontal
        if (cursors.left.isDown || cursors.A.isDown) {
            this.body.setVelocityX(-speed);
        } else if (cursors.right.isDown || cursors.D.isDown) {
            this.body.setVelocityX(speed);
        }

        // Movimiento Vertical
        if (cursors.up.isDown || cursors.W.isDown) {
            this.body.setVelocityY(-speed);
        } else if (cursors.down.isDown || cursors.S.isDown) {
            this.body.setVelocityY(speed);
        }

        // Normalizar velocidad diagonal
        this.body.velocity.normalize().scale(speed);

        // Actualizar Nametag
        this.nametag.setPosition(this.x, this.y - 40);

        // Emitir posición si hay cambios significativos (opcional, se hará en GameScene)
    }

    destroy() {
        if (this.nametag) this.nametag.destroy();
        super.destroy();
    }
}
