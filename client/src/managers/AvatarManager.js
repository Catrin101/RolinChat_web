/**
 * client/src/managers/AvatarManager.js
 * Gestiona la persistencia local de perfiles y el avatar activo.
 */

import { AvatarData } from './AvatarData.js';

const STORAGE_KEY = 'rolinchat_profiles';

class AvatarManager {
    constructor() {
        this.profiles = this.loadFromStorage();
        this.activeAvatar = null;
    }

    /**
     * Carga los perfiles guardados en localStorage.
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            const parsed = data ? JSON.parse(data) : {};
            const profiles = {};

            // Rehidratar como instancias de AvatarData
            Object.keys(parsed).forEach(id => {
                profiles[id] = AvatarData.fromJSON(parsed[id]);
            });

            return profiles;
        } catch (e) {
            console.error('Error cargando perfiles:', e);
            return {};
        }
    }

    /**
     * Guarda un perfil en el almacenamiento local.
     * @param {AvatarData} avatar 
     */
    saveProfile(avatar) {
        if (!avatar.validate()) {
            throw new Error('Datos de avatar inválidos');
        }
        this.profiles[avatar.id] = avatar;
        this.syncToStorage();
    }

    /**
     * Elimina un perfil.
     * @param {string} id 
     */
    deleteProfile(id) {
        if (this.profiles[id]) {
            delete this.profiles[id];
            this.syncToStorage();
        }
    }

    /**
     * Persiste el estado actual de perfiles a localStorage.
     */
    syncToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
    }

    /**
     * Obtiene todos los perfiles como un array.
     */
    getAllProfiles() {
        return Object.values(this.profiles);
    }

    /**
     * Establece el avatar activo para la sesión.
     */
    setActiveAvatar(id) {
        if (this.profiles[id]) {
            this.activeAvatar = this.profiles[id];
            return this.activeAvatar;
        }
        return null;
    }
}

export const avatarManager = new AvatarManager();
