/**
 * client/src/ui/JointSceneUI.js
 * Gestiona los overlays y la lógica de las escenas conjuntas.
 */

export class JointSceneUI {
    constructor(socket) {
        this.socket = socket;
        this.activePartnerId = null;
        this.currentObjectId = null;

        // Elements
        this.overlays = {
            invite: document.getElementById('scene-invite-overlay'),
            selection: document.getElementById('scene-selection-overlay'),
            view: document.getElementById('scene-view-overlay')
        };

        this.elements = {
            inviteText: document.getElementById('invite-text'),
            partnerText: document.getElementById('selection-partner-text'),
            actionsList: document.getElementById('actions-list'),
            sceneImage: document.getElementById('scene-image')
        };

        this.buttons = {
            accept: document.getElementById('btn-accept-invite'),
            reject: document.getElementById('btn-reject-invite'),
            cancel: document.getElementById('btn-cancel-selection'),
            back: document.getElementById('btn-back-selection'),
            close: document.getElementById('btn-close-scene')
        };

        this.setupEvents();
        this.setupSocketHandlers();
    }

    setupEvents() {
        this.buttons.accept.onclick = () => {
            this.socket.emit('scene:accept', {
                hostId: this.activePartnerId,
                objectId: this.currentObjectId
            });
            this.hideOverlay('invite');
        };

        this.buttons.reject.onclick = () => {
            this.hideOverlay('invite');
            this.activePartnerId = null;
        };

        this.buttons.cancel.onclick = () => {
            this.socket.emit('scene:end', { partnerId: this.activePartnerId });
            this.hideOverlay('selection');
        };

        this.buttons.back.onclick = () => {
            this.hideOverlay('view');
            this.showOverlay('selection');
        };

        this.buttons.close.onclick = () => {
            this.socket.emit('scene:end', { partnerId: this.activePartnerId });
            this.hideOverlay('view');
        };
    }

    setupSocketHandlers() {
        // Recibir invitación
        this.socket.on('scene:invite', ({ hostId, hostName, objectId }) => {
            if (this.activePartnerId) return; // Ya en escena

            this.activePartnerId = hostId;
            this.currentObjectId = objectId;
            this.elements.inviteText.innerText = `${hostName} te invita a una escena en ${objectId}.`;
            this.showOverlay('invite');
        });

        // Comenzar selección
        this.socket.on('scene:start_selection', ({ partnerId, partnerName, actions }) => {
            this.activePartnerId = partnerId;
            this.elements.partnerText.innerText = `Con ${partnerName}`;
            this.renderActions(actions);
            this.hideOverlay('invite');
            this.showOverlay('selection');
        });

        // Reproducir escena
        this.socket.on('scene:play', ({ actionId }) => {
            // Cargar datos de la acción (simplificado: el servidor podría mandar la URL)
            // Por ahora buscamos en una lista interna o re-filtramos
            fetch('/data/acciones_rol.json')
                .then(res => res.json())
                .then(data => {
                    const action = data.acciones.find(a => a.id === actionId);
                    if (action) {
                        this.elements.sceneImage.src = action.image_url || action.imagen_url;
                        this.hideOverlay('selection');
                        this.showOverlay('view');
                    }
                });
        });

        // Cerrar escena
        this.socket.on('scene:close', () => {
            this.hideOverlay('invite');
            this.hideOverlay('selection');
            this.hideOverlay('view');
            this.activePartnerId = null;
        });
    }

    renderActions(actions) {
        this.elements.actionsList.innerHTML = '';
        if (actions.length === 0) {
            this.elements.actionsList.innerHTML = '<p class="system">No hay acciones compatibles para vuestros personajes.</p>';
            return;
        }

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary';
            btn.innerText = action.nombre;
            btn.onclick = () => {
                this.socket.emit('scene:select_action', {
                    partnerId: this.activePartnerId,
                    actionId: action.id
                });
            };
            this.elements.actionsList.appendChild(btn);
        });
    }

    showOverlay(name) {
        this.overlays[name].classList.remove('hidden');
    }

    hideOverlay(name) {
        this.overlays[name].classList.add('hidden');
    }
}
