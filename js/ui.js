/**
 * Dungeon Quest - UI Module
 * Handles all user interface interactions and rendering
 */

const UI = {
    // UI elements cache
    elements: {},

    /**
     * Initialize the UI module
     */
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.setupMinimap();
        console.log('UI module initialized');
    },

    /**
     * Cache DOM elements for faster access
     */
    cacheElements: function() {
        this.elements = {
            dungeon: document.getElementById('dungeon-view'),
            minimap: document.getElementById('mini-map'),
            toggleMinimapBtn: document.getElementById('toggle-minimap'),
            statusPanel: document.getElementById('status-panel'),
            messageLog: document.getElementById('message-log'),
            actionBar: document.getElementById('action-bar'),

            // Status elements
            characterName: document.getElementById('character-name'),
            characterLevel: document.getElementById('character-level'),
            healthBar: document.querySelector('.health-bar .bar-fill'),
            healthText: document.querySelector('.health-bar .bar-text'),
            energyBar: document.querySelector('.energy-bar .bar-fill'),
            energyText: document.querySelector('.energy-bar .bar-text'),
            statStr: document.getElementById('stat-str'),
            statAgi: document.getElementById('stat-agi'),
            statInt: document.getElementById('stat-int'),
            statCon: document.getElementById('stat-con'),

            // Action buttons
            actionAttack: document.getElementById('action-attack'),
            actionSpecial: document.getElementById('action-special'),
            actionItem: document.getElementById('action-item'),
            actionWait: document.getElementById('action-wait'),
            actionInventory: document.getElementById('action-inventory')
        };
    },

    /**
     * Bind event listeners
     */
    bindEvents: function() {
        // Toggle minimap visibility
        this.elements.toggleMinimapBtn.addEventListener('click', () => {
            this.elements.minimap.classList.toggle('hidden');
        });

        // Action buttons - Use one-time event binding to prevent duplicates
        this.elements.actionAttack.onclick = () => {
            this.logMessage('You prepare to attack!', 'combat');
            // Game.performAction('attack');
        };

        this.elements.actionSpecial.onclick = () => {
            this.logMessage('Choose a special attack...', 'system');
            // Game.showSpecialAttacks();
        };

        this.elements.actionItem.onclick = () => {
            this.logMessage('Choose an item to use...', 'system');
            // Game.showItems();
        };

        this.elements.actionWait.onclick = () => {
            this.logMessage('You wait a turn...', 'system');
            // Game.performAction('wait');
        };

        this.elements.actionInventory.onclick = () => {
            this.logMessage('Opening inventory...', 'system');
            // Game.openInventory();
        };
    },

    /**
     * Setup the minimap display
     */
    setupMinimap: function() {
        // Minimap implementation will be added later
        this.elements.minimap.innerHTML = '<div class="minimap-placeholder">Map</div>';
    },

    /**
     * Update the player stats display
     * @param {Object} player - The player object with current stats
     */
    updatePlayerStats: function(player) {
        // Update character info
        this.elements.characterName.textContent = player.name;
        this.elements.characterLevel.textContent = `Level ${player.level}`;

        // Update health bar
        const healthPercent = (player.currentHP / player.maxHP) * 100;
        this.elements.healthBar.style.width = `${healthPercent}%`;
        this.elements.healthText.textContent = `${player.currentHP}/${player.maxHP}`;

        // Update energy bar
        const energyPercent = (player.currentEP / player.maxEP) * 100;
        this.elements.energyBar.style.width = `${energyPercent}%`;
        this.elements.energyText.textContent = `${player.currentEP}/${player.maxEP}`;

        // Update attribute stats
        this.elements.statStr.textContent = player.attributes.strength;
        this.elements.statAgi.textContent = player.attributes.agility;
        this.elements.statInt.textContent = player.attributes.intelligence;
        this.elements.statCon.textContent = player.attributes.constitution;
    },

    /**
     * Add a message to the game log
     * @param {string} message - The message text
     * @param {string} type - The message type (system, combat, item)
     */
    logMessage: function(message, type = 'system') {
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;

        this.elements.messageLog.appendChild(messageElement);
        this.elements.messageLog.scrollTop = this.elements.messageLog.scrollHeight;

        // Limit the number of messages to prevent performance issues
        while (this.elements.messageLog.children.length > 50) {
            this.elements.messageLog.removeChild(this.elements.messageLog.firstChild);
        }
    },

    /**
     * Update action buttons based on the current game state
     * @param {Object} state - The current game state
     */
    updateActionButtons: function(state) {
        // Enable/disable attack button based on whether an enemy is in range
        this.elements.actionAttack.disabled = !state.enemyInRange;
        this.elements.actionAttack.classList.toggle('disabled', !state.enemyInRange);

        // Enable/disable special attack button based on available energy
        this.elements.actionSpecial.disabled = state.player.currentEP < 10;
        this.elements.actionSpecial.classList.toggle('disabled', state.player.currentEP < 10);

        // Other button states can be updated based on game conditions
    },

    /**
     * Render the minimap based on the explored dungeon
     * @param {Object} dungeon - The dungeon object with room data
     * @param {Object} player - The player object with position data
     */
    renderMinimap: function(dungeon, player) {
        // This will be implemented when the minimap feature is developed
        // For now, just a placeholder
    },

    /**
     * Show a popup dialog with custom message and options
     * @param {string} title - The dialog title
     * @param {string} message - The dialog message
     * @param {Array} options - Array of option objects with text and callback properties
     */
    showDialog: function(title, message, options) {
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';

        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'game-menu';

        // Add title
        const titleElem = document.createElement('h2');
        titleElem.className = 'menu-title';
        titleElem.textContent = title;
        dialog.appendChild(titleElem);

        // Add message
        const messageElem = document.createElement('p');
        messageElem.className = 'dialog-message';
        messageElem.textContent = message;
        dialog.appendChild(messageElem);

        // Add options
        options.forEach(option => {
            const optionElem = document.createElement('div');
            optionElem.className = 'menu-option';
            optionElem.textContent = option.text;
            optionElem.addEventListener('click', () => {
                document.body.removeChild(overlay);
                if (option.callback) option.callback();
            });
            dialog.appendChild(optionElem);
        });

        // Add to document
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }
};

// When the document is fully loaded, initialize the UI
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
