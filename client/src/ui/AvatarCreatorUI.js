/**
 * client/src/ui/AvatarCreatorUI.js
 * Lógica de la interfaz del creador de avatares.
 */

import { AvatarData } from '../managers/AvatarData.js';
import { avatarManager } from '../managers/AvatarManager.js';

export class AvatarCreatorUI {
    constructor(appCallbacks) {
        this.app = appCallbacks; // { showView: fn }

        // Elements
        this.elements = {
            list: document.getElementById('profiles-list'),
            editor: document.getElementById('profile-editor'),
            form: {
                nombre: document.getElementById('av-nombre'),
                desc: document.getElementById('av-desc'),
                raza: document.getElementById('av-raza'),
                sexo: document.getElementById('av-sexo'),
                imagen: document.getElementById('av-imagen'),
                preview: document.getElementById('av-preview')
            },
            buttons: {
                new: document.getElementById('btn-new-profile'),
                save: document.getElementById('btn-save-profile'),
                cancel: document.getElementById('btn-cancel-profile'),
                back: document.getElementById('btn-back-menu')
            }
        };

        this.editingId = null;
        this.config = { razas: [], sexos: [] };

        this.init();
    }

    async init() {
        // Cargar config global
        try {
            const [r, s] = await Promise.all([
                fetch('/data/razas.json').then(res => res.json()),
                fetch('/data/sexos.json').then(res => res.json())
            ]);
            this.config.razas = r.razas;
            this.config.sexos = s.sexos;
            this.renderSelects();
        } catch (e) {
            console.error('Error cargando configuración:', e);
        }

        this.renderList();
        this.setupEvents();
    }

    setupEvents() {
        this.elements.buttons.new.addEventListener('click', () => this.showEditor());
        this.elements.buttons.cancel.addEventListener('click', () => this.hideEditor());
        this.elements.buttons.back.addEventListener('click', () => this.app.showView('menu'));

        this.elements.buttons.save.addEventListener('click', () => this.handleSave());

        this.elements.form.imagen.addEventListener('input', () => {
            this.elements.form.preview.src = this.elements.form.imagen.value || 'assets/avatars/placeholder.png';
        });
    }

    renderSelects() {
        this.elements.form.raza.innerHTML = '<option value="">Seleccionar Raza</option>' +
            this.config.razas.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');

        this.elements.form.sexo.innerHTML = '<option value="">Seleccionar Sexo</option>' +
            this.config.sexos.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
    }

    renderList() {
        const profiles = avatarManager.getAllProfiles();
        this.elements.list.innerHTML = profiles.length === 0
            ? '<li class="chat-msg system">No hay personajes creados todavía.</li>'
            : '';

        profiles.forEach(p => {
            const li = document.createElement('li');
            li.className = `profile-item ${avatarManager.activeAvatar?.id === p.id ? 'active' : ''}`;
            li.innerHTML = `
                <div class="profile-info">
                    <img src="${p.imagen_url}" class="profile-thumb" onerror="this.src='assets/avatars/placeholder.png'">
                    <div>
                        <strong>${p.nombre}</strong><br>
                        <small>${p.raza_id} - ${p.sexo_id}</small>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn-small btn-secondary btn-edit" data-id="${p.id}">Editar</button>
                    <button class="btn-small btn-primary btn-select" data-id="${p.id}">Seleccionar</button>
                </div>
            `;

            li.querySelector('.btn-edit').addEventListener('click', (e) => this.showEditor(p.id));
            li.querySelector('.btn-select').addEventListener('click', (e) => {
                avatarManager.setActiveAvatar(p.id);
                this.renderList();
            });

            this.elements.list.appendChild(li);
        });
    }

    showEditor(id = null) {
        this.editingId = id;
        this.elements.editor.classList.remove('hidden');

        if (id) {
            const p = avatarManager.profiles[id];
            this.elements.form.nombre.value = p.nombre;
            this.elements.form.desc.value = p.descripcion;
            this.elements.form.raza.value = p.raza_id;
            this.elements.form.sexo.value = p.sexo_id;
            this.elements.form.imagen.value = p.imagen_url;
            this.elements.form.preview.src = p.imagen_url;
        } else {
            this.elements.form.nombre.value = '';
            this.elements.form.desc.value = '';
            this.elements.form.raza.value = '';
            this.elements.form.sexo.value = '';
            this.elements.form.imagen.value = '';
            this.elements.form.preview.src = 'assets/avatars/placeholder.png';
        }
    }

    hideEditor() {
        this.elements.editor.classList.add('hidden');
        this.editingId = null;
    }

    handleSave() {
        const data = {
            id: this.editingId,
            nombre: this.elements.form.nombre.value,
            descripcion: this.elements.form.desc.value,
            raza_id: this.elements.form.raza.value,
            sexo_id: this.elements.form.sexo.value,
            imagen_url: this.elements.form.imagen.value
        };

        const avatar = new AvatarData(data);
        if (!avatar.validate()) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        avatarManager.saveProfile(avatar);
        this.hideEditor();
        this.renderList();
    }
}
