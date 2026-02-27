/**
 * client/src/managers/AvatarData.js
 * Estructura de datos para un perfil de personaje.
 */

export class AvatarData {
    constructor({ id, nombre, descripcion, imagen_url, raza_id, sexo_id }) {
        this.id = id || crypto.randomUUID();
        this.nombre = nombre || 'Nuevo Personaje';
        this.descripcion = descripcion || '';
        this.imagen_url = imagen_url || 'assets/avatars/placeholder.png';
        this.raza_id = raza_id || 'humano';
        this.sexo_id = sexo_id || 'masculino';
    }

    /**
     * Valida que los campos obligatorios estén presentes.
     * @returns {boolean}
     */
    validate() {
        if (!this.nombre.trim()) return false;
        if (!this.raza_id) return false;
        if (!this.sexo_id) return false;
        return true;
    }

    /**
     * Convierte el objeto a un objeto plano para guardado o envío por red.
     */
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            descripcion: this.descripcion,
            imagen_url: this.imagen_url,
            raza_id: this.raza_id,
            sexo_id: this.sexo_id
        };
    }

    /**
     * Crea una instancia de AvatarData a partir de un objeto JSON.
     */
    static fromJSON(data) {
        return new AvatarData(data);
    }
}
