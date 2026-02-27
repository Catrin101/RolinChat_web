/**
 * client/public/js/main.js
 * Lógica principal del cliente y gestión de UI.
 */

import { avatarManager } from '/src/managers/AvatarManager.js';
import { AvatarCreatorUI } from '/src/ui/AvatarCreatorUI.js';

const socket = io();

// UI Elements
const views = {
    menu: document.getElementById('main-menu'),
    avatar: document.getElementById('avatar-view'),
    game: document.getElementById('game-view')
};

const inputs = {
    playerName: document.getElementById('player-name'),
    roomCode: document.getElementById('room-code'),
    chat: document.getElementById('chat-input')
};

const buttons = {
    showCreator: document.getElementById('btn-show-creator'),
    create: document.getElementById('btn-create-room'),
    join: document.getElementById('btn-join-room'),
    leave: document.getElementById('btn-leave-room'),
    sendChat: document.getElementById('btn-send-chat')
};

const displays = {
    roomName: document.getElementById('display-room-name'),
    roomCode: document.getElementById('display-room-code'),
    playerName: document.getElementById('display-player-name'),
    chatLog: document.getElementById('chat-log')
};

// --- Initialization ---

// Inicializar UI del Creador
const creatorUI = new AvatarCreatorUI({
    showView: (name) => showView(name)
});

// --- View Management ---
function showView(viewName) {
    Object.keys(views).forEach(key => {
        views[key].classList.toggle('active', key === viewName);
    });
}

// --- Event Handlers ---

// Mostrar Creador
buttons.showCreator.addEventListener('click', () => {
    showView('avatar');
});

// Crear Sala
buttons.create.addEventListener('click', () => {
    const name = inputs.playerName.value.trim() || 'Anónimo';

    if (!avatarManager.activeAvatar) {
        alert('Por favor, selecciona o crea un personaje primero en "Configurar Personajes".');
        return;
    }

    socket.emit('room:create', {
        roomName: 'Avatar Lobby',
        mapKey: 'lobby',
        playerName: name,
        avatar: avatarManager.activeAvatar.toJSON()
    });
});

// Unirse a Sala
buttons.join.addEventListener('click', () => {
    const name = inputs.playerName.value.trim() || 'Anónimo';
    const code = inputs.roomCode.value.trim().toUpperCase();

    if (code.length !== 8) {
        alert('El código debe tener 8 caracteres.');
        return;
    }

    if (!avatarManager.activeAvatar) {
        alert('Por favor, selecciona o crea un personaje primero en "Configurar Personajes".');
        return;
    }

    socket.emit('room:join', {
        code,
        playerName: name,
        avatar: avatarManager.activeAvatar.toJSON()
    });
});

// Salir
buttons.leave.addEventListener('click', () => {
    window.location.reload();
});

// Chat
function sendMessage() {
    const text = inputs.chat.value.trim();
    if (text) {
        socket.emit('chat:message', { text });
        inputs.chat.value = '';
    }
}

buttons.sendChat.addEventListener('click', sendMessage);
inputs.chat.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- Socket Events ---

socket.on('room:created', ({ code, url }) => {
    displays.roomName.innerText = 'Sala: Avatar Lobby';
    displays.roomCode.innerText = code;
    displays.playerName.innerText = avatarManager.activeAvatar.nombre;
    showView('game');
    appendSystemMessage(`Sala creada. Código: ${code}`);

    // Iniciar Phaser
    import('/src/managers/GameManager.js').then(m => {
        m.gameManager.init(socket, { code, players: [] }, avatarManager.activeAvatar);

        m.gameManager.game.events.on('ui:message', (text) => {
            appendSystemMessage(text);
        });
    });

    // Iniciar UI de Escenas
    import('/src/ui/JointSceneUI.js').then(m => {
        new m.JointSceneUI(socket);
    });
});

socket.on('room:joined', ({ code, name, players }) => {
    displays.roomName.innerText = `Sala: ${name}`;
    displays.roomCode.innerText = code;
    displays.playerName.innerText = avatarManager.activeAvatar.nombre;
    showView('game');
    appendSystemMessage(`Te has unido a la sala ${name}.`);
    appendSystemMessage(`Jugadores presentes: ${players.map(p => p.name).join(', ')}`);

    // Iniciar Phaser
    import('/src/managers/GameManager.js').then(m => {
        m.gameManager.init(socket, { code, name, players }, avatarManager.activeAvatar);

        // Manejar mensajes de Phaser a la UI de Chat
        m.gameManager.game.events.on('ui:message', (text) => {
            appendSystemMessage(text);
        });
    });

    // Iniciar UI de Escenas
    import('/src/ui/JointSceneUI.js').then(m => {
        new m.JointSceneUI(socket);
    });
});

socket.on('room:error', ({ message }) => {
    alert(message);
});

socket.on('chat:message', ({ sender, text }) => {
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg';
    msgEl.innerHTML = `<span class="sender">${sender}:</span><span class="text">${escapeHtml(text)}</span>`;
    displays.chatLog.appendChild(msgEl);
    displays.chatLog.scrollTop = displays.chatLog.scrollHeight;
});

socket.on('player:joined', ({ name }) => {
    appendSystemMessage(`${name} se ha unido.`);
});

socket.on('player:left', ({ name }) => {
    appendSystemMessage(`${name} ha salido.`);
});

// --- Utilities ---

function appendSystemMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg system';
    msgEl.innerText = text;
    displays.chatLog.appendChild(msgEl);
    displays.chatLog.scrollTop = displays.chatLog.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
