/**
 * Dungeon Quest - Player Character
 * Handles player stats, movement, and actions
 */

const Player = {
    // Position
    x: 0,
    y: 0,

    // Stats
    hp: 100,
    maxHp: 100,
    ep: 50,
    maxEp: 50,

    // Character properties
    class: 'warrior', // warrior, rogue, mage, cleric
    level: 1,
    xp: 0,
    xpToNextLevel: 100,

    // Attributes
    strength: 10,
    agility: 10,
    intelligence: 10,
    constitution: 10,

    // Inventory
    inventory: [],
    maxInventorySize: 10,
    gold: 0,

    // Equipment
    equipment: {
        weapon: null,
        armor: null,
        helmet: null,
        accessory: null
    },

    /**
     * Initialize the player character
     * @param {string} characterClass - The selected character class
     */
    init: function(characterClass = 'warrior') {
        console.log(`Initializing player character with class: ${characterClass}`);

        // Set default class
        this.class = characterClass;

        // Set starting stats based on class
        this.setClassStats(characterClass);

        // Reset other values
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.inventory = [];
        this.gold = 0;
        this.equipment = {
            weapon: null,
            armor: null,
            helmet: null,
            accessory: null
        };
    },

    /**
     * Set stats based on character class
     * @param {string} characterClass - The character class
     */
    setClassStats: function(characterClass) {
        switch (characterClass) {
            case 'warrior':
                this.maxHp = 120;
                this.hp = this.maxHp;
                this.maxEp = 40;
                this.ep = this.maxEp;
                this.strength = 14;
                this.agility = 8;
                this.intelligence = 6;
                this.constitution = 12;
                break;

            case 'rogue':
                this.maxHp = 80;
                this.hp = this.maxHp;
                this.maxEp = 60;
                this.ep = this.maxEp;
                this.strength = 8;
                this.agility = 14;
                this.intelligence = 10;
                this.constitution = 8;
                break;

            case 'mage':
                this.maxHp = 70;
                this.hp = this.maxHp;
                this.maxEp = 100;
                this.ep = this.maxEp;
                this.strength = 6;
                this.agility = 8;
                this.intelligence = 14;
                this.constitution = 6;
                break;

            case 'cleric':
                this.maxHp = 90;
                this.hp = this.maxHp;
                this.maxEp = 80;
                this.ep = this.maxEp;
                this.strength = 8;
                this.agility = 6;
                this.intelligence = 12;
                this.constitution = 10;
                break;

            default:
                // Default to warrior if unknown class
                this.setClassStats('warrior');
                break;
        }
    },

    /**
     * Place player at dungeon entrance
     */
    placeAtEntrance: function() {
        this.x = Dungeon.entrance.x;
        this.y = Dungeon.entrance.y;

        // Update visibility
        Dungeon.updateVisibility(this.x, this.y, Game.settings.visibilityRadius);
    },

    /**
     * Attempt to move the player in a direction
     * @param {number} dx - X direction (-1, 0, 1)
     * @param {number} dy - Y direction (-1, 0, 1)
     * @returns {boolean} True if movement was successful
     */
    move: function(dx, dy) {
        // Calculate new position
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Check if the move is valid
        if (Dungeon.isWalkable(newX, newY)) {
            // Check for entities at the new position
            const entity = Entities.getEntityAt(newX, newY);

            if (entity) {
                // Handle entity interaction
                this.interactWithEntity(entity);
                return false; // Movement blocked by entity
            }

            // Move the player
            this.x = newX;
            this.y = newY;

            // Check for special tiles
            this.checkSpecialTiles();

            // Update field of vision
            Dungeon.updateVisibility(this.x, this.y, Game.settings.visibilityRadius);

            return true;
        }

        // Movement blocked
        UI.logMessage("You can't move there.", 'system');
        return false;
    },

    /**
     * Check for special tiles at the player's position
     */
    checkSpecialTiles: function() {
        const cellType = Dungeon.grid[this.y][this.x];

        // Check for exit
        if (cellType === Dungeon.CELL_TYPES.EXIT) {
            UI.logMessage("You found the exit! Press 'Space' to descend.", 'system');
        }

        // Check for items
        const item = Items.getItemAt(this.x, this.y);
        if (item) {
            UI.logMessage(`You see ${item.name} here. Press 'Space' to pick it up.`, 'item');
        }
    },

    /**
     * Interact with an entity
     * @param {Object} entity - The entity to interact with
     */
    interactWithEntity: function(entity) {
        if (entity.type === 'enemy') {
            // Attack the enemy
            Combat.attack(this, entity);
        } else if (entity.type === 'npc') {
            // Talk to NPC
            UI.showDialog(entity.id);
        }
    },

    /**
     * Pick up an item at the player's position
     * @returns {boolean} True if item was picked up
     */
    pickupItem: function() {
        const item = Items.getItemAt(this.x, this.y);

        if (!item) {
            UI.logMessage("There's nothing to pick up here.", 'system');
            return false;
        }

        if (this.inventory.length >= this.maxInventorySize) {
            UI.logMessage("Your inventory is full!", 'system');
            return false;
        }

        // Add item to inventory
        this.inventory.push(item);

        // Remove item from dungeon
        Items.removeItemAt(this.x, this.y);

        UI.logMessage(`You picked up ${item.name}.`, 'item');
        return true;
    },

    /**
     * Use an item from inventory
     * @param {number} inventoryIndex - Index of item in inventory
     * @returns {boolean} True if item was used successfully
     */
    useItem: function(inventoryIndex) {
        if (inventoryIndex < 0 || inventoryIndex >= this.inventory.length) {
            return false;
        }

        const item = this.inventory[inventoryIndex];

        // Check if item is usable
        if (!item.usable) {
            UI.logMessage(`You can't use the ${item.name}.`, 'system');
            return false;
        }

        // Apply item effects
        if (item.effect.type === 'heal') {
            this.heal(item.effect.value);
            UI.logMessage(`You used ${item.name} and restored ${item.effect.value} health.`, 'item');
        } else if (item.effect.type === 'energy') {
            this.restoreEnergy(item.effect.value);
            UI.logMessage(`You used ${item.name} and restored ${item.effect.value} energy.`, 'item');
        }

        // Remove item from inventory if consumable
        if (item.consumable) {
            this.inventory.splice(inventoryIndex, 1);
        }

        return true;
    },

    /**
     * Equip an item from inventory
     * @param {number} inventoryIndex - Index of item in inventory
     * @returns {boolean} True if item was equipped
     */
    equipItem: function(inventoryIndex) {
        if (inventoryIndex < 0 || inventoryIndex >= this.inventory.length) {
            return false;
        }

        const item = this.inventory[inventoryIndex];

        // Check if item is equippable
        if (!item.equippable) {
            UI.logMessage(`You can't equip the ${item.name}.`, 'system');
            return false;
        }

        // Get the slot for this item
        const slot = item.slot;

        // Check if something is already equipped in this slot
        if (this.equipment[slot]) {
            // Put the currently equipped item back in inventory
            this.inventory.push(this.equipment[slot]);
        }

        // Equip the new item
        this.equipment[slot] = item;

        // Remove from inventory
        this.inventory.splice(inventoryIndex, 1);

        UI.logMessage(`You equipped ${item.name}.`, 'item');

        return true;
    },

    /**
     * Heal the player
     * @param {number} amount - Amount to heal
     */
    heal: function(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    },

    /**
     * Restore energy
     * @param {number} amount - Amount to restore
     */
    restoreEnergy: function(amount) {
        this.ep = Math.min(this.ep + amount, this.maxEp);
    },

    /**
     * Take damage
     * @param {number} damage - Amount of damage
     * @returns {boolean} True if player survives
     */
    takeDamage: function(damage) {
        // Calculate damage reduction from armor
        let damageReduction = 0;

        if (this.equipment.armor) {
            damageReduction += this.equipment.armor.defense || 0;
        }

        if (this.equipment.helmet) {
            damageReduction += this.equipment.helmet.defense || 0;
        }

        // Apply damage reduction
        const actualDamage = Math.max(1, damage - damageReduction);

        this.hp -= actualDamage;

        UI.logMessage(`You take ${actualDamage} damage!`, 'combat');

        // Check if player died
        if (this.hp <= 0) {
            this.die();
            return false;
        }

        return true;
    },

    /**
     * Handle player death
     */
    die: function() {
        this.hp = 0;
        UI.logMessage("You have been defeated!", 'combat');
        Game.state.running = false;
        Game.state.currentScreen = 'gameover';
        UI.showGameOver();
    },

    /**
     * Calculate attack damage
     * @returns {number} Attack damage
     */
    calculateAttackDamage: function() {
        let baseDamage = this.strength / 2;

        // Add weapon damage
        if (this.equipment.weapon) {
            baseDamage += this.equipment.weapon.damage || 0;
        }

        // Random variation (80% to 120% of base damage)
        const damageVariation = Utils.randomInt(80, 120) / 100;

        // Calculate final damage
        return Math.max(1, Math.floor(baseDamage * damageVariation));
    },

    /**
     * Add experience points
     * @param {number} amount - XP amount
     */
    addExperience: function(amount) {
        this.xp += amount;

        UI.logMessage(`You gained ${amount} experience.`, 'system');

        // Check for level up
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    },

    /**
     * Level up the character
     */
    levelUp: function() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

        // Increase stats
        this.maxHp += 10;
        this.hp = this.maxHp;
        this.maxEp += 5;
        this.ep = this.maxEp;

        // Attributes increase based on class
        if (this.class === 'warrior') {
            this.strength += 2;
            this.constitution += 1;
        } else if (this.class === 'rogue') {
            this.agility += 2;
            this.strength += 1;
        } else if (this.class === 'mage') {
            this.intelligence += 2;
            this.agility += 1;
        } else if (this.class === 'cleric') {
            this.intelligence += 1;
            this.constitution += 2;
        }

        UI.logMessage(`You reached level ${this.level}!`, 'system');
    },

    /**
     * Get data for saving
     * @returns {Object} Player data
     */
    getSaveData: function() {
        return {
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            ep: this.ep,
            maxEp: this.maxEp,
            class: this.class,
            level: this.level,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            strength: this.strength,
            agility: this.agility,
            intelligence: this.intelligence,
            constitution: this.constitution,
            inventory: this.inventory,
            maxInventorySize: this.maxInventorySize,
            gold: this.gold,
            equipment: this.equipment
        };
    },

    /**
     * Load player from save data
     * @param {Object} data - Save data
     */
    loadSaveData: function(data) {
        this.x = data.x;
        this.y = data.y;
        this.hp = data.hp;
        this.maxHp = data.maxHp;
        this.ep = data.ep;
        this.maxEp = data.maxEp;
        this.class = data.class;
        this.level = data.level;
        this.xp = data.xp;
        this.xpToNextLevel = data.xpToNextLevel;
        this.strength = data.strength;
        this.agility = data.agility;
        this.intelligence = data.intelligence;
        this.constitution = data.constitution;
        this.inventory = data.inventory;
        this.maxInventorySize = data.maxInventorySize;
        this.gold = data.gold;
        this.equipment = data.equipment;
    }
};
