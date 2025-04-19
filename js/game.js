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

        // Cache important elements
        this.elements = {
            dungeonView: document.getElementById('dungeon-view')
        };

        // Initialize game modules
        UI.init();
        Player.init();
        Items.init();

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

        // Mouse/Touch events for the dungeon view
        this.elements.dungeonView = document.getElementById('dungeon-view');
        this.elements.dungeonView.addEventListener('click', (e) => {
            if (!this.state.running) return;
            this.handleDungeonClick(e);
        });

        // Touch events for mobile
        this.elements.dungeonView.addEventListener('touchend', (e) => {
            if (!this.state.running) return;
            e.preventDefault(); // Prevent default behavior like scrolling

            // Use the first touch point
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.handleDungeonClick(touch);
            }
        }, { passive: false });
    },

    /**
     * Handle click/touch on the dungeon view
     * @param {Event|Touch} event - The click event or touch object
     */
    handleDungeonClick: function(event) {
        // Get click position relative to dungeon view
        const rect = this.elements.dungeonView.getBoundingClientRect();
        const clickX = (event.clientX || event.pageX) - rect.left;
        const clickY = (event.clientY || event.pageY) - rect.top;

        // Calculate cell size based on dungeon view dimensions and dungeon size
        const cellWidth = rect.width / Dungeon.width;
        const cellHeight = rect.height / Dungeon.height;

        // Calculate which cell was clicked
        const cellX = Math.floor(clickX / cellWidth);
        const cellY = Math.floor(clickY / cellHeight);

        // Safety check for within bounds
        if (!Utils.isInBounds(cellX, cellY, Dungeon.width, Dungeon.height)) {
            return;
        }

        // Only allow clicking adjacent cells to the player or the player's cell
        const dx = cellX - Player.x;
        const dy = cellY - Player.y;

        // Check if clicked cell is the player's position
        if (dx === 0 && dy === 0) {
            // Clicking on player could be a 'wait' action
            this.handlePlayerAction();
            return;
        }

        // Check if clicked cell is adjacent
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            // Move player toward the clicked cell
            this.handlePlayerMove(dx, dy);
        } else {
            // For cells farther away, calculate the direction to move
            // This will allow players to click farther cells to move in that direction
            this.handleMovementTowardCell(cellX, cellY);
        }
    },

    /**
     * Handle movement toward a distant cell
     * @param {number} targetX - Target cell X coordinate
     * @param {number} targetY - Target cell Y coordinate
     */
    handleMovementTowardCell: function(targetX, targetY) {
        // Determine primary direction to move based on which difference is larger
        const dx = targetX - Player.x;
        const dy = targetY - Player.y;

        // Normalize to get direction (-1, 0, 1)
        const moveX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
        const moveY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;

        // If moving diagonally is allowed in your game, you can use both
        // For simplicity, prioritize the axis with the larger difference
        if (Math.abs(dx) >= Math.abs(dy)) {
            this.handlePlayerMove(moveX, 0);
        } else {
            this.handlePlayerMove(0, moveY);
        }
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
        // Render dungeon grid
        UI.renderDungeon(Dungeon, Player);

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
