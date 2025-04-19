/**
 * Dungeon Quest - Main Game Logic
 * Core game loop and state management
 */

const Game = {
    /** Game state */
    state: {
        running: false,
        currentScreen: 'title', // title, game, inventory, gameover
        turn: 0,
        level: 1,
    },

    /** Game settings */
    settings: {
        dungeonWidth: 50,
        dungeonHeight: 50,
        visibilityRadius: 8,
    },

    /**
     * Initialize the game
     */
    init: function() {
        console.log('Initializing Dungeon Quest...');

        // Initialize game modules
        UI.init();
        Player.init();

        // Setup event listeners
        this.setupEventListeners();

        // Show title screen
        UI.showTitleScreen();
    },

    /**
     * Setup keyboard and mouse event listeners
     */
    setupEventListeners: function() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (!this.state.running) return;

            switch (e.key) {
                // Movement
                case 'ArrowUp':
                case 'w':
                    this.handlePlayerMove(0, -1);
                    break;
                case 'ArrowRight':
                case 'd':
                    this.handlePlayerMove(1, 0);
                    break;
                case 'ArrowDown':
                case 's':
                    this.handlePlayerMove(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.handlePlayerMove(-1, 0);
                    break;
                // Actions
                case ' ':
                    this.handlePlayerAction();
                    break;
                case 'i':
                    UI.toggleInventory();
                    break;
                case 'Escape':
                    UI.togglePauseMenu();
                    break;
            }
        });
    },

    /**
     * Start a new game
     */
    startNewGame: function() {
        console.log('Starting new game...');

        // Reset game state
        this.state.running = true;
        this.state.turn = 0;
        this.state.level = 1;
        this.state.currentScreen = 'game';

        // Generate first dungeon level
        Dungeon.generate(this.settings.dungeonWidth, this.settings.dungeonHeight, this.state.level);

        // Place player at entrance
        Player.placeAtEntrance();

        // Update UI
        this.updateUI();

        // Add welcome message
        UI.logMessage('Welcome to the dungeon! Find the stairs to descend deeper.', 'system');
    },

    /**
     * Handle player movement attempt
     * @param {number} dx - X direction (-1, 0, 1)
     * @param {number} dy - Y direction (-1, 0, 1)
     */
    handlePlayerMove: function(dx, dy) {
        if (Player.move(dx, dy)) {
            // Movement successful
            this.advanceTurn();
        }
    },

    /**
     * Handle player action (use item, attack, etc.)
     */
    handlePlayerAction: function() {
        // Implementation will depend on context
        console.log('Player action');
        this.advanceTurn();
    },

    /**
     * Advance the game by one turn
     * Processing enemy movements and world updates
     */
    advanceTurn: function() {
        this.state.turn++;

        // Process enemy turns
        Entities.processTurn();

        // Update visibility
        Dungeon.updateVisibility(Player.x, Player.y, this.settings.visibilityRadius);

        // Update UI
        this.updateUI();
    },

    /**
     * Update all UI elements
     */
    updateUI: function() {
        // Update player stats
        UI.updatePlayerStats(Player);

        // Update minimap
        UI.renderMinimap(Dungeon, Player);

        // Update action buttons based on game state
        UI.updateActionButtons({
            player: Player,
            enemyInRange: Entities.isEnemyInRange(Player.x, Player.y, 1),
        });
    },

    /**
     * Save current game to local storage
     */
    saveGame: function() {
        const saveData = {
            player: Player.getSaveData(),
            dungeon: Dungeon.getSaveData(),
            entities: Entities.getSaveData(),
            state: this.state
        };

        if (Utils.saveToStorage('dungeonQuest_saveGame', saveData)) {
            UI.logMessage('Game saved successfully.', 'system');
            return true;
        } else {
            UI.logMessage('Failed to save game!', 'system');
            return false;
        }
    },

    /**
     * Load game from local storage
     */
    loadGame: function() {
        const saveData = Utils.loadFromStorage('dungeonQuest_saveGame');

        if (!saveData) {
            UI.logMessage('No saved game found!', 'system');
            return false;
        }

        // Restore game state
        this.state = saveData.state;
        this.state.running = true;

        // Restore game components
        Player.loadSaveData(saveData.player);
        Dungeon.loadSaveData(saveData.dungeon);
        Entities.loadSaveData(saveData.entities);

        // Update UI
        this.updateUI();
        UI.logMessage('Game loaded successfully.', 'system');
        return true;
    }
};

// Initialize the game when the page is loaded
window.addEventListener('load', () => {
    Game.init();
});
