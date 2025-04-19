/**
 * Dungeon Quest - Entities
 * Handles monsters, NPCs, and other entities in the game
 */

const Entities = {
    // List of all entities in the current dungeon level
    entities: [],

    // Entity types and templates
    ENTITY_TYPES: {
        ENEMY: 'enemy',
        NPC: 'npc',
        TRAP: 'trap'
    },

    // Enemy templates
    enemyTemplates: {
        rat: {
            name: 'Rat',
            type: 'enemy',
            subtype: 'melee',
            hp: 10,
            maxHp: 10,
            damage: 2,
            defense: 0,
            xpValue: 5,
            moveSpeed: 1, // Moves every turn
            aggressive: true,
            detectionRadius: 5
        },

        skeleton: {
            name: 'Skeleton',
            type: 'enemy',
            subtype: 'melee',
            hp: 20,
            maxHp: 20,
            damage: 4,
            defense: 1,
            xpValue: 10,
            moveSpeed: 2, // Moves every other turn
            aggressive: true,
            detectionRadius: 6
        },

        archer: {
            name: 'Archer',
            type: 'enemy',
            subtype: 'ranged',
            hp: 15,
            maxHp: 15,
            damage: 5,
            defense: 0,
            attackRange: 4,
            xpValue: 12,
            moveSpeed: 2,
            aggressive: true,
            detectionRadius: 7
        },

        mage: {
            name: 'Mage',
            type: 'enemy',
            subtype: 'magic',
            hp: 12,
            maxHp: 12,
            damage: 7,
            defense: 0,
            attackRange: 3,
            xpValue: 15,
            moveSpeed: 3, // Moves every 3 turns
            aggressive: true,
            detectionRadius: 8
        }
    },

    /**
     * Initialize entities system
     */
    init: function() {
        this.entities = [];
    },

    /**
     * Process entity turns
     */
    processTurn: function() {
        this.entities.forEach(entity => {
            if (entity.type === this.ENTITY_TYPES.ENEMY) {
                this.processEnemyTurn(entity);
            }
        });
    },

    /**
     * Process an enemy's turn
     * @param {Object} enemy - The enemy entity
     */
    processEnemyTurn: function(enemy) {
        // Skip if it's not this entity's turn to move
        if (Game.state.turn % enemy.moveSpeed !== 0) {
            return;
        }

        // Check if player is within detection radius
        const distToPlayer = Utils.gridDistance(enemy.x, enemy.y, Player.x, Player.y);

        if (enemy.aggressive && distToPlayer <= enemy.detectionRadius) {
            // Move towards player or attack
            if (distToPlayer <= 1) {
                // Adjacent to player, attack
                this.attackPlayer(enemy);
            } else {
                // Move towards player
                this.moveEnemyTowardsPlayer(enemy);
            }
        } else {
            // Random movement if player not detected
            this.moveEnemyRandomly(enemy);
        }
    },

    /**
     * Attack the player
     * @param {Object} enemy - The enemy entity
     */
    attackPlayer: function(enemy) {
        // Calculate damage
        const damage = this.calculateEnemyDamage(enemy);

        // Apply damage to player
        Player.takeDamage(damage);

        // Add message
        UI.addMessage(`${enemy.name} attacks you for ${damage} damage!`, 'combat');
    },

    /**
     * Calculate enemy damage
     * @param {Object} enemy - The enemy entity
     * @returns {number} Calculated damage
     */
    calculateEnemyDamage: function(enemy) {
        // Base damage from enemy template
        let damage = enemy.damage;

        // Add random variation (80% to 120%)
        const variation = Utils.randomInt(80, 120) / 100;
        damage = Math.max(1, Math.floor(damage * variation));

        return damage;
    },

    /**
     * Move enemy towards player
     * @param {Object} enemy - The enemy entity
     */
    moveEnemyTowardsPlayer: function(enemy) {
        // Simple pathfinding - try to decrease distance to player
        let dx = 0;
        let dy = 0;

        // Determine direction to move (X)
        if (enemy.x < Player.x) dx = 1;
        else if (enemy.x > Player.x) dx = -1;

        // Determine direction to move (Y)
        if (enemy.y < Player.y) dy = 1;
        else if (enemy.y > Player.y) dy = -1;

        // Try horizontal movement first, then vertical
        if (dx !== 0 && this.canEntityMove(enemy, dx, 0)) {
            this.moveEntity(enemy, dx, 0);
        } else if (dy !== 0 && this.canEntityMove(enemy, 0, dy)) {
            this.moveEntity(enemy, 0, dy);
        } else if (dx !== 0 && dy !== 0) {
            // Try diagonals as a last resort
            if (this.canEntityMove(enemy, dx, dy)) {
                this.moveEntity(enemy, dx, dy);
            }
        }
    },

    /**
     * Move enemy in a random direction
     * @param {Object} enemy - The enemy entity
     */
    moveEnemyRandomly: function(enemy) {
        // Only move occasionally to reduce random movement
        if (Math.random() < 0.3) {
            // Generate a random direction
            const directions = [
                {dx: 0, dy: -1},  // Up
                {dx: 1, dy: 0},   // Right
                {dx: 0, dy: 1},   // Down
                {dx: -1, dy: 0}   // Left
            ];

            // Shuffle directions
            directions.sort(() => Math.random() - 0.5);

            // Try each direction until we find a valid move
            for (const dir of directions) {
                if (this.canEntityMove(enemy, dir.dx, dir.dy)) {
                    this.moveEntity(enemy, dir.dx, dir.dy);
                    break;
                }
            }
        }
    },

    /**
     * Check if an entity can move in a direction
     * @param {Object} entity - The entity
     * @param {number} dx - X direction
     * @param {number} dy - Y direction
     * @returns {boolean} True if the move is valid
     */
    canEntityMove: function(entity, dx, dy) {
        const newX = entity.x + dx;
        const newY = entity.y + dy;

        // Check map boundaries and walls
        if (!Dungeon.isWalkable(newX, newY)) {
            return false;
        }

        // Check for other entities
        if (this.getEntityAt(newX, newY)) {
            return false;
        }

        // Check for player
        if (newX === Player.x && newY === Player.y) {
            return false;
        }

        return true;
    },

    /**
     * Move an entity
     * @param {Object} entity - The entity to move
     * @param {number} dx - X direction
     * @param {number} dy - Y direction
     */
    moveEntity: function(entity, dx, dy) {
        entity.x += dx;
        entity.y += dy;
    },

    /**
     * Get entity at the specified position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} The entity or null if none
     */
    getEntityAt: function(x, y) {
        return this.entities.find(entity => entity.x === x && entity.y === y) || null;
    },

    /**
     * Create a new enemy
     * @param {string} type - Enemy type from templates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} The created enemy
     */
    createEnemy: function(type, x, y) {
        if (!this.enemyTemplates[type]) {
            console.error(`Enemy template not found: ${type}`);
            return null;
        }

        // Clone the template
        const enemy = JSON.parse(JSON.stringify(this.enemyTemplates[type]));

        // Set position
        enemy.x = x;
        enemy.y = y;

        // Add to entities list
        this.entities.push(enemy);

        return enemy;
    },

    /**
     * Populate the dungeon with enemies
     * @param {number} level - Dungeon level
     */
    populateDungeon: function(level) {
        // Clear existing entities
        this.entities = [];

        // Number of enemies scales with level
        const numEnemies = 5 + Math.floor(level * 1.5);

        // Enemy types available at this level
        const availableTypes = [];

        // Always have rats
        availableTypes.push('rat');

        // Add skeletons at level 2+
        if (level >= 2) availableTypes.push('skeleton');

        // Add archers at level 3+
        if (level >= 3) availableTypes.push('archer');

        // Add mages at level 4+
        if (level >= 4) availableTypes.push('mage');

        // Place enemies
        let enemiesPlaced = 0;
        const attempts = numEnemies * 10; // Limit attempts to prevent infinite loops
        let attempt = 0;

        while (enemiesPlaced < numEnemies && attempt < attempts) {
            attempt++;

            // Select a random room (not the first or last)
            const roomIndex = Utils.randomInt(1, Dungeon.rooms.length - 2);
            const room = Dungeon.rooms[roomIndex];

            // Select a random position in the room
            const x = Utils.randomInt(room.x + 1, room.x + room.width - 2);
            const y = Utils.randomInt(room.y + 1, room.y + room.height - 2);

            // Check if the position is valid
            if (Dungeon.isWalkable(x, y) && !this.getEntityAt(x, y)) {
                // Select a random enemy type from available types
                const enemyType = availableTypes[Utils.randomInt(0, availableTypes.length - 1)];

                // Create the enemy
                this.createEnemy(enemyType, x, y);
                enemiesPlaced++;
            }
        }

        console.log(`Placed ${enemiesPlaced} enemies in the dungeon`);
    },

    /**
     * Apply damage to an enemy
     * @param {Object} enemy - The enemy
     * @param {number} damage - Amount of damage
     * @returns {boolean} True if enemy was killed
     */
    damageEnemy: function(enemy, damage) {
        // Apply defense reduction
        const actualDamage = Math.max(1, damage - (enemy.defense || 0));

        enemy.hp -= actualDamage;

        UI.addMessage(`You hit the ${enemy.name} for ${actualDamage} damage!`, 'combat');

        // Check if enemy died
        if (enemy.hp <= 0) {
            return this.killEnemy(enemy);
        }

        return false;
    },

    /**
     * Kill an enemy and grant rewards
     * @param {Object} enemy - The enemy to kill
     * @returns {boolean} Always returns true
     */
    killEnemy: function(enemy) {
        UI.addMessage(`You defeated the ${enemy.name}!`, 'combat');

        // Grant XP
        Player.addExperience(enemy.xpValue);

        // Remove from entities list
        const index = this.entities.indexOf(enemy);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }

        // TODO: Drop items (will be implemented in items system)

        return true;
    },

    /**
     * Get data for saving
     * @returns {Object} Save data
     */
    getSaveData: function() {
        return {
            entities: this.entities
        };
    },

    /**
     * Load from save data
     * @param {Object} data - Save data
     */
    loadSaveData: function(data) {
        this.entities = data.entities;
    }
};
