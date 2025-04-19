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
     * Render the dungeon grid to the DOM
     * @param {Object} dungeon - The dungeon object
     * @param {Object} player - The player object
     */
    renderDungeon: function(dungeon, player) {
        // Clear previous dungeon content
        Utils.clearElement(this.elements.dungeon);

        // Create a grid container
        const dungeonGrid = document.createElement('div');
        dungeonGrid.className = 'dungeon-grid';

        // Set the grid size based on dungeon dimensions
        dungeonGrid.style.gridTemplateColumns = `repeat(${dungeon.width}, 1fr)`;
        dungeonGrid.style.gridTemplateRows = `repeat(${dungeon.height}, 1fr)`;

        // Create cells for the dungeon
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                // Only show cells that are visible or have been explored
                if (dungeon.visible[y][x] || dungeon.explored[y][x]) {
                    // Determine cell type class
                    let cellType = '';
                    switch (dungeon.grid[y][x]) {
                        case dungeon.CELL_TYPES.WALL:
                            cellType = 'cell-wall';
                            break;
                        case dungeon.CELL_TYPES.FLOOR:
                            cellType = 'cell-floor';
                            break;
                        case dungeon.CELL_TYPES.DOOR:
                            cellType = 'cell-door';
                            break;
                        case dungeon.CELL_TYPES.ENTRANCE:
                        case dungeon.CELL_TYPES.EXIT:
                            cellType = 'cell-stairs';
                            cell.textContent = dungeon.grid[y][x] === dungeon.CELL_TYPES.ENTRANCE ? '<' : '>';
                            break;
                    }

                    cell.classList.add(cellType);

                    // Add visibility class
                    if (dungeon.visible[y][x]) {
                        cell.classList.add('cell-visible');
                    } else if (dungeon.explored[y][x]) {
                        cell.classList.add('cell-explored');
                    }

                    // Check if player is here
                    if (player.x === x && player.y === y) {
                        const playerIcon = document.createElement('div');
                        playerIcon.className = 'player-icon';
                        playerIcon.textContent = '@';
                        cell.appendChild(playerIcon);
                    }

                    // Check if any entities are here
                    const entity = Entities.getEntityAt(x, y);
                    if (entity && dungeon.visible[y][x]) {
                        const entityIcon = document.createElement('div');
                        entityIcon.className = `entity-icon entity-${entity.type}`;

                        // Set icon based on entity type
                        if (entity.type === 'enemy') {
                            switch (entity.subtype) {
                                case 'melee':
                                    entityIcon.textContent = 'M';
                                    break;
                                case 'ranged':
                                    entityIcon.textContent = 'R';
                                    break;
                                case 'magic':
                                    entityIcon.textContent = 'Z';
                                    break;
                                default:
                                    entityIcon.textContent = 'E';
                            }
                        } else if (entity.type === 'npc') {
                            entityIcon.textContent = 'N';
                        } else if (entity.type === 'trap') {
                            entityIcon.textContent = '^';
                        }

                        cell.appendChild(entityIcon);
                    }
                } else {
                    // Hidden cell (fog of war)
                    cell.classList.add('cell-hidden');
                }

                dungeonGrid.appendChild(cell);
            }
        }

        // Add grid to dungeon view
        this.elements.dungeon.appendChild(dungeonGrid);
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
            this.toggleInventory();
        };

        // Add character sheet button handler if it exists
        const characterButton = document.getElementById('action-character');
        if (characterButton) {
            characterButton.onclick = () => {
                this.logMessage('Opening character sheet...', 'system');
                this.toggleCharacterSheet();
            };
        }
    },

    /**
     * Setup the minimap display
     */
    setupMinimap: function() {
        // Initialize the minimap with a grid
        this.elements.minimap.innerHTML = '<div class="minimap-container"></div>';

        // Get the minimap container
        this.elements.minimapContainer = document.querySelector('.minimap-container');
    },

    /**
     * Update the player stats display
     * @param {Object} player - The player object with current stats
     */
    updatePlayerStats: function(player) {
        // Update character info
        this.elements.characterName.textContent = player.class || 'Adventurer';
        this.elements.characterLevel.textContent = `Level ${player.level}`;

        // Update health bar
        const healthPercent = (player.hp / player.maxHp) * 100;
        this.elements.healthBar.style.width = `${healthPercent}%`;
        this.elements.healthText.textContent = `${player.hp}/${player.maxHp}`;

        // Update energy bar
        const energyPercent = (player.ep / player.maxEp) * 100;
        this.elements.energyBar.style.width = `${energyPercent}%`;
        this.elements.energyText.textContent = `${player.ep}/${player.maxEp}`;

        // Update attribute stats
        this.elements.statStr.textContent = player.strength || 0;
        this.elements.statAgi.textContent = player.agility || 0;
        this.elements.statInt.textContent = player.intelligence || 0;
        this.elements.statCon.textContent = player.constitution || 0;
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
        this.elements.actionSpecial.disabled = state.player.ep < 10;
        this.elements.actionSpecial.classList.toggle('disabled', state.player.ep < 10);

        // Other button states can be updated based on game conditions
    },

    /**
     * Render the minimap based on the explored dungeon
     * @param {Object} dungeon - The dungeon object with room data
     * @param {Object} player - The player object with position data
     */
    renderMinimap: function(dungeon, player) {
        // Clear the previous minimap content
        this.elements.minimapContainer.innerHTML = '';

        // Calculate the scale factor to fit the dungeon on the minimap
        const minimapWidth = 150;
        const minimapHeight = 150;
        const cellSize = Math.min(
            Math.floor(minimapWidth / dungeon.width),
            Math.floor(minimapHeight / dungeon.height)
        );

        // Set the container size based on the scaled dungeon
        this.elements.minimapContainer.style.width = (dungeon.width * cellSize) + 'px';
        this.elements.minimapContainer.style.height = (dungeon.height * cellSize) + 'px';
        this.elements.minimapContainer.style.position = 'relative';

        // Create minimap cells for each explored dungeon cell
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                // Only show cells that have been explored
                if (dungeon.explored[y][x]) {
                    const cellType = dungeon.grid[y][x];
                    const isVisible = dungeon.visible[y][x];
                    const isPlayerPosition = (player.x === x && player.y === y);

                    // Create a cell element
                    const cell = document.createElement('div');
                    cell.className = 'minimap-cell';
                    cell.style.width = cellSize + 'px';
                    cell.style.height = cellSize + 'px';
                    cell.style.position = 'absolute';
                    cell.style.left = (x * cellSize) + 'px';
                    cell.style.top = (y * cellSize) + 'px';

                    // Set cell color based on type
                    if (isPlayerPosition) {
                        cell.style.backgroundColor = '#f00'; // Player is red
                    } else {
                        switch (cellType) {
                            case dungeon.CELL_TYPES.WALL:
                                cell.style.backgroundColor = '#444'; // Wall is dark gray
                                break;
                            case dungeon.CELL_TYPES.FLOOR:
                                cell.style.backgroundColor = isVisible ? '#aaa' : '#666'; // Floor is light/dark gray
                                break;
                            case dungeon.CELL_TYPES.DOOR:
                                cell.style.backgroundColor = '#a52'; // Door is brown
                                break;
                            case dungeon.CELL_TYPES.ENTRANCE:
                                cell.style.backgroundColor = '#0a0'; // Entrance is green
                                break;
                            case dungeon.CELL_TYPES.EXIT:
                                cell.style.backgroundColor = '#00a'; // Exit is blue
                                break;
                            default:
                                cell.style.backgroundColor = '#666'; // Default is gray
                        }
                    }

                    this.elements.minimapContainer.appendChild(cell);
                }
            }
        }
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
    },

    /**
     * Show the game title screen
     */
    showTitleScreen: function() {
        // Create title screen elements
        const titleScreen = document.createElement('div');
        titleScreen.id = 'title-screen';
        titleScreen.className = 'game-menu';

        // Add title
        const gameTitle = document.createElement('h1');
        gameTitle.className = 'menu-title';
        gameTitle.textContent = 'DUNGEON QUEST';
        titleScreen.appendChild(gameTitle);

        // Add subtitle
        const subtitle = document.createElement('p');
        subtitle.className = 'subtitle';
        subtitle.textContent = 'A Roguelike Adventure';
        titleScreen.appendChild(subtitle);

        // Add menu options
        const startGame = document.createElement('div');
        startGame.className = 'menu-option';
        startGame.textContent = 'Start New Game';
        startGame.addEventListener('click', () => {
            document.body.removeChild(titleScreen);
            Game.startNewGame();
        });
        titleScreen.appendChild(startGame);

        const loadGame = document.createElement('div');
        loadGame.className = 'menu-option';
        loadGame.textContent = 'Load Game';
        loadGame.addEventListener('click', () => {
            document.body.removeChild(titleScreen);
            if (!Game.loadGame()) {
                // If loading failed, start a new game
                Game.startNewGame();
            }
        });
        titleScreen.appendChild(loadGame);

        // Add to document
        document.body.appendChild(titleScreen);
    },

    /**
     * Update the game screen
     * Currently unused but mentioned in code
     */
    updateGameScreen: function() {
        // This functionality is now handled by Game.updateUI()
        console.log('updateGameScreen is deprecated, use Game.updateUI() instead');
    },

    /**
     * Toggle the inventory screen
     */
    toggleInventory: function() {
        // Check if inventory screen already exists
        const existingInventory = document.getElementById('inventory-screen');

        if (existingInventory) {
            // If inventory is already open, close it
            document.body.removeChild(existingInventory.parentElement);
            return;
        }

        // Otherwise, open the inventory
        this.showInventoryScreen();
    },

    /**
     * Toggle the character sheet screen
     */
    toggleCharacterSheet: function() {
        // Check if character sheet already exists
        const existingCharSheet = document.getElementById('character-sheet');

        if (existingCharSheet) {
            // If character sheet is already open, close it
            document.body.removeChild(existingCharSheet.parentElement);
            return;
        }

        // Otherwise, open the character sheet
        this.showCharacterSheet();
    },

    /**
     * Show the inventory management screen
     */
    showInventoryScreen: function() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';

        // Create inventory screen container
        const inventoryScreen = document.createElement('div');
        inventoryScreen.id = 'inventory-screen';
        inventoryScreen.className = 'game-menu';

        // Create header
        const header = document.createElement('div');
        header.className = 'inventory-header';

        const title = document.createElement('h2');
        title.textContent = 'Inventory';
        header.appendChild(title);

        const goldDisplay = document.createElement('div');
        goldDisplay.className = 'gold-display';
        goldDisplay.textContent = `${Player.gold} Gold`;
        header.appendChild(goldDisplay);

        inventoryScreen.appendChild(header);

        // Create sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'inventory-sections';

        // Create equipment section
        const equipmentSection = document.createElement('div');
        equipmentSection.className = 'inventory-section';

        const equipmentTitle = document.createElement('div');
        equipmentTitle.className = 'section-title';
        equipmentTitle.textContent = 'Equipment';
        equipmentSection.appendChild(equipmentTitle);

        const equipmentSlots = document.createElement('div');
        equipmentSlots.className = 'equipment-slots';

        // Create equipment slots
        const slots = ['weapon', 'armor', 'helmet', 'accessory'];
        const slotNames = {
            'weapon': 'Weapon',
            'armor': 'Armor',
            'helmet': 'Helmet',
            'accessory': 'Accessory'
        };

        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'equipment-slot';
            slotElement.dataset.slot = slot;

            const slotName = document.createElement('div');
            slotName.className = 'slot-name';
            slotName.textContent = slotNames[slot];
            slotElement.appendChild(slotName);

            const itemInfo = document.createElement('div');
            itemInfo.className = 'item-info';

            // Check if item is equipped in this slot
            if (Player.equipment[slot]) {
                const item = Player.equipment[slot];
                itemInfo.textContent = item.name;
            } else {
                itemInfo.textContent = 'Empty';
                itemInfo.style.color = '#666';
            }

            slotElement.appendChild(itemInfo);
            equipmentSlots.appendChild(slotElement);
        });

        equipmentSection.appendChild(equipmentSlots);
        sectionsContainer.appendChild(equipmentSection);

        // Create inventory items section
        const itemsSection = document.createElement('div');
        itemsSection.className = 'inventory-section';

        const itemsTitle = document.createElement('div');
        itemsTitle.className = 'section-title';
        itemsTitle.textContent = 'Items';
        itemsSection.appendChild(itemsTitle);

        const itemList = document.createElement('div');
        itemList.className = 'item-list';

        // Add inventory items
        if (Player.inventory.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'No items in inventory';
            emptyMessage.style.color = '#666';
            emptyMessage.style.padding = '10px';
            itemList.appendChild(emptyMessage);
        } else {
            Player.inventory.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                itemElement.dataset.index = index;

                // Create item icon
                const icon = document.createElement('div');
                icon.className = 'item-icon';

                // Set icon based on item type
                if (item.type === 'weapon') {
                    icon.textContent = '⚔';
                } else if (item.type === 'armor') {
                    icon.textContent = '🛡';
                } else if (item.type === 'potion') {
                    icon.textContent = '🧪';
                } else if (item.type === 'scroll') {
                    icon.textContent = '📜';
                } else {
                    icon.textContent = '?';
                }

                itemElement.appendChild(icon);

                // Create item name
                const name = document.createElement('div');
                name.className = 'item-name';
                name.textContent = item.name;
                itemElement.appendChild(name);

                // Create item type
                const type = document.createElement('div');
                type.className = 'item-type';
                type.textContent = item.type;
                itemElement.appendChild(type);

                // Add click handler for selection
                itemElement.addEventListener('click', () => {
                    // Remove selected class from all items
                    document.querySelectorAll('.inventory-item').forEach(el => {
                        el.classList.remove('selected');
                    });

                    // Add selected class to this item
                    itemElement.classList.add('selected');

                    // Update item description
                    const description = document.querySelector('.item-description');
                    if (description) {
                        description.textContent = item.description || 'No description available.';
                    }

                    // Update action buttons
                    const useButton = document.getElementById('inventory-use-btn');
                    const equipButton = document.getElementById('inventory-equip-btn');
                    const dropButton = document.getElementById('inventory-drop-btn');

                    if (useButton) {
                        useButton.disabled = !item.usable;
                    }

                    if (equipButton) {
                        equipButton.disabled = !item.equippable;
                    }

                    if (dropButton) {
                        dropButton.disabled = false;
                    }
                });

                itemList.appendChild(itemElement);
            });
        }

        itemsSection.appendChild(itemList);

        // Add capacity indicator
        const capacityIndicator = document.createElement('div');
        capacityIndicator.className = 'capacity-indicator';
        capacityIndicator.textContent = `${Player.inventory.length}/${Player.maxInventorySize} items`;
        itemsSection.appendChild(capacityIndicator);

        sectionsContainer.appendChild(itemsSection);
        inventoryScreen.appendChild(sectionsContainer);

        // Item description section
        const descriptionSection = document.createElement('div');
        descriptionSection.className = 'item-description';
        descriptionSection.textContent = 'Select an item to see its description.';
        inventoryScreen.appendChild(descriptionSection);

        // Action buttons
        const actionSection = document.createElement('div');
        actionSection.className = 'inventory-actions';

        const useButton = document.createElement('button');
        useButton.id = 'inventory-use-btn';
        useButton.textContent = 'Use';
        useButton.disabled = true;
        useButton.addEventListener('click', () => {
            const selectedItem = document.querySelector('.inventory-item.selected');
            if (selectedItem) {
                const index = parseInt(selectedItem.dataset.index);
                if (Player.useItem(index)) {
                    // Close and reopen inventory to refresh
                    this.toggleInventory();
                    this.toggleInventory();
                }
            }
        });
        actionSection.appendChild(useButton);

        const equipButton = document.createElement('button');
        equipButton.id = 'inventory-equip-btn';
        equipButton.textContent = 'Equip';
        equipButton.disabled = true;
        equipButton.addEventListener('click', () => {
            const selectedItem = document.querySelector('.inventory-item.selected');
            if (selectedItem) {
                const index = parseInt(selectedItem.dataset.index);
                if (Player.equipItem(index)) {
                    // Close and reopen inventory to refresh
                    this.toggleInventory();
                    this.toggleInventory();
                }
            }
        });
        actionSection.appendChild(equipButton);

        const dropButton = document.createElement('button');
        dropButton.id = 'inventory-drop-btn';
        dropButton.textContent = 'Drop';
        dropButton.disabled = true;
        dropButton.addEventListener('click', () => {
            const selectedItem = document.querySelector('.inventory-item.selected');
            if (selectedItem) {
                const index = parseInt(selectedItem.dataset.index);

                // Implement drop functionality (will need to be added to Player)
                this.showDialog('Drop Item', `Are you sure you want to drop ${Player.inventory[index].name}?`, [
                    {
                        text: 'Yes',
                        callback: () => {
                            // Drop item and close/reopen inventory
                            // This functionality will need to be added to Player
                            this.logMessage(`You dropped ${Player.inventory[index].name}.`, 'item');
                            Player.inventory.splice(index, 1);
                            this.toggleInventory();
                            this.toggleInventory();
                        }
                    },
                    {
                        text: 'No',
                        callback: () => {
                            // Do nothing
                        }
                    }
                ]);
            }
        });
        actionSection.appendChild(dropButton);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            this.toggleInventory();
        });
        actionSection.appendChild(closeButton);

        inventoryScreen.appendChild(actionSection);

        // Add to overlay and then to document
        overlay.appendChild(inventoryScreen);
        document.body.appendChild(overlay);
    },

    /**
     * Show the character sheet screen
     */
    showCharacterSheet: function() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';

        // Create character sheet container
        const characterSheet = document.createElement('div');
        characterSheet.id = 'character-sheet';
        characterSheet.className = 'game-menu';

        // Create header
        const header = document.createElement('div');
        header.className = 'character-header';

        const title = document.createElement('h2');
        title.textContent = 'Character';
        header.appendChild(title);

        const characterClass = document.createElement('div');
        characterClass.className = 'character-class';
        characterClass.textContent = `Class: ${Player.class.charAt(0).toUpperCase() + Player.class.slice(1)}`;
        header.appendChild(characterClass);

        characterSheet.appendChild(header);

        // Create character information
        const characterInfo = document.createElement('div');
        characterInfo.className = 'character-info';

        // Character portrait
        const portraitSection = document.createElement('div');
        portraitSection.className = 'character-portrait-section';

        const portrait = document.createElement('div');
        portrait.className = 'character-portrait';
        // Portrait icon based on class
        let portraitSymbol = '@';
        if (Player.class === 'warrior') portraitSymbol = '⚔';
        else if (Player.class === 'rogue') portraitSymbol = '🗡';
        else if (Player.class === 'mage') portraitSymbol = '✨';
        else if (Player.class === 'cleric') portraitSymbol = '✝';
        portrait.textContent = portraitSymbol;
        portraitSection.appendChild(portrait);

        const levelDisplay = document.createElement('div');
        levelDisplay.className = 'level-display';
        levelDisplay.textContent = `Level ${Player.level}`;
        portraitSection.appendChild(levelDisplay);

        characterInfo.appendChild(portraitSection);

        // Stats section
        const statsSection = document.createElement('div');
        statsSection.className = 'stats-section';

        // Resources
        const resources = document.createElement('div');
        resources.className = 'character-resources';

        const healthResource = document.createElement('div');
        healthResource.className = 'resource-item';
        healthResource.innerHTML = `<span class="resource-label">Health:</span> <span class="resource-value">${Player.hp}/${Player.maxHp}</span>`;
        resources.appendChild(healthResource);

        const energyResource = document.createElement('div');
        energyResource.className = 'resource-item';
        energyResource.innerHTML = `<span class="resource-label">Energy:</span> <span class="resource-value">${Player.ep}/${Player.maxEp}</span>`;
        resources.appendChild(energyResource);

        const xpResource = document.createElement('div');
        xpResource.className = 'resource-item';
        xpResource.innerHTML = `<span class="resource-label">Experience:</span> <span class="resource-value">${Player.xp}/${Player.xpToNextLevel}</span>`;
        resources.appendChild(xpResource);

        statsSection.appendChild(resources);

        // Attributes
        const attributes = document.createElement('div');
        attributes.className = 'character-attributes';

        const attributesList = [
            { name: 'Strength', value: Player.strength, description: 'Affects physical damage and carrying capacity' },
            { name: 'Agility', value: Player.agility, description: 'Affects initiative, dodge chance, and critical hit rate' },
            { name: 'Intelligence', value: Player.intelligence, description: 'Affects spell power and puzzle-solving bonuses' },
            { name: 'Constitution', value: Player.constitution, description: 'Affects max HP and resistance to effects' }
        ];

        attributesList.forEach(attr => {
            const attrItem = document.createElement('div');
            attrItem.className = 'attribute-item';

            const attrName = document.createElement('div');
            attrName.className = 'attribute-name';
            attrName.textContent = attr.name;
            attrItem.appendChild(attrName);

            const attrValue = document.createElement('div');
            attrValue.className = 'attribute-value';
            attrValue.textContent = attr.value;
            attrItem.appendChild(attrValue);

            // Add tooltip behavior
            attrItem.setAttribute('title', attr.description);

            attributes.appendChild(attrItem);
        });

        statsSection.appendChild(attributes);
        characterInfo.appendChild(statsSection);
        characterSheet.appendChild(characterInfo);

        // Equipment summary
        const equipmentSummary = document.createElement('div');
        equipmentSummary.className = 'equipment-summary';

        const equipmentTitle = document.createElement('h3');
        equipmentTitle.className = 'section-title';
        equipmentTitle.textContent = 'Equipment';
        equipmentSummary.appendChild(equipmentTitle);

        const equipmentList = document.createElement('div');
        equipmentList.className = 'equipment-list';

        const slots = ['weapon', 'armor', 'helmet', 'accessory'];
        const slotNames = {
            'weapon': 'Weapon',
            'armor': 'Armor',
            'helmet': 'Helmet',
            'accessory': 'Accessory'
        };

        slots.forEach(slot => {
            const slotItem = document.createElement('div');
            slotItem.className = 'equipment-item';

            const slotName = document.createElement('div');
            slotName.className = 'slot-name';
            slotName.textContent = slotNames[slot];
            slotItem.appendChild(slotName);

            const itemName = document.createElement('div');
            itemName.className = 'item-name';

            if (Player.equipment[slot]) {
                itemName.textContent = Player.equipment[slot].name;
            } else {
                itemName.textContent = 'None';
                itemName.style.color = '#666';
            }

            slotItem.appendChild(itemName);
            equipmentList.appendChild(slotItem);
        });

        equipmentSummary.appendChild(equipmentList);
        characterSheet.appendChild(equipmentSummary);

        // Combat stats
        const combatStats = document.createElement('div');
        combatStats.className = 'combat-stats';

        const combatTitle = document.createElement('h3');
        combatTitle.className = 'section-title';
        combatTitle.textContent = 'Combat Statistics';
        combatStats.appendChild(combatTitle);

        const statsList = document.createElement('div');
        statsList.className = 'stats-list';

        // Calculate derived combat stats
        let damageValue = Player.calculateAttackDamage();
        let defenseValue = 0;

        if (Player.equipment.armor) {
            defenseValue += Player.equipment.armor.defense || 0;
        }

        if (Player.equipment.helmet) {
            defenseValue += Player.equipment.helmet.defense || 0;
        }

        const criticalChance = Math.min(5 + Math.floor(Player.agility / 4), 25);
        const dodgeChance = Math.min(2 + Math.floor(Player.agility / 5), 15);

        const combatStatsList = [
            { name: 'Damage', value: damageValue },
            { name: 'Defense', value: defenseValue },
            { name: 'Critical Hit', value: `${criticalChance}%` },
            { name: 'Dodge Chance', value: `${dodgeChance}%` }
        ];

        combatStatsList.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';

            const statName = document.createElement('div');
            statName.className = 'stat-name';
            statName.textContent = stat.name;
            statItem.appendChild(statName);

            const statValue = document.createElement('div');
            statValue.className = 'stat-value';
            statValue.textContent = stat.value;
            statItem.appendChild(statValue);

            statsList.appendChild(statItem);
        });

        combatStats.appendChild(statsList);
        characterSheet.appendChild(combatStats);

        // Action buttons
        const actionSection = document.createElement('div');
        actionSection.className = 'character-actions';

        const inventoryButton = document.createElement('button');
        inventoryButton.textContent = 'Inventory';
        inventoryButton.addEventListener('click', () => {
            this.toggleCharacterSheet();
            this.toggleInventory();
        });
        actionSection.appendChild(inventoryButton);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            this.toggleCharacterSheet();
        });
        actionSection.appendChild(closeButton);

        characterSheet.appendChild(actionSection);

        // Add to overlay and then to document
        overlay.appendChild(characterSheet);
        document.body.appendChild(overlay);
    },

    /**
     * Toggle the pause menu
     */
    togglePauseMenu: function() {
        // This will be implemented when pause menu feature is developed
        this.logMessage('Pause menu not yet implemented', 'system');
    }
};

// When the document is fully loaded, initialize the UI
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

// Add CSS for title screen
document.head.insertAdjacentHTML('beforeend', `
<style>
#title-screen {
    background-color: #111;
    width: 400px;
    height: 300px;
    text-align: center;
}

#title-screen h1 {
    font-size: 36px;
    color: #ff9;
    margin: 20px 0;
    text-shadow: 2px 2px 4px #000;
}

#title-screen .subtitle {
    color: #aaa;
    margin-bottom: 30px;
}
</style>
`);
