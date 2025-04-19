/**
 * Dungeon Quest - Combat System
 * Handles combat interactions between player and entities
 */

const Combat = {
    /**
     * Initialize the combat system
     */
    init: function() {
        console.log('Initializing combat system...');
    },

    /**
     * Process an attack from attacker to defender
     * @param {Object} attacker - The attacking entity (player or enemy)
     * @param {Object} defender - The defending entity (player or enemy)
     * @returns {boolean} True if the attack was successful
     */
    attack: function(attacker, defender) {
        // Calculate damage based on attacker
        let damage = 0;

        if (attacker === Player) {
            // Player attacking enemy
            damage = Player.calculateAttackDamage();

            // Apply damage to the enemy
            return Entities.damageEnemy(defender, damage);
        } else {
            // Enemy attacking player
            damage = Entities.calculateEnemyDamage(attacker);

            // Apply damage to player
            return Player.takeDamage(damage);
        }
    },

    /**
     * Determine if an attack hits or misses
     * @param {Object} attacker - The attacking entity
     * @param {Object} defender - The defending entity
     * @returns {boolean} True if the attack hits
     */
    checkHit: function(attacker, defender) {
        // Base hit chance
        let hitChance = 85; // 85% base chance to hit

        // Adjust based on attacker's agility
        if (attacker === Player) {
            hitChance += Player.agility * 1; // Each point adds 1% chance
        } else if (attacker.agility) {
            hitChance += attacker.agility * 1;
        }

        // Adjust based on defender's agility (dodge)
        if (defender === Player) {
            hitChance -= Player.agility * 0.5; // Each point reduces chance by 0.5%
        } else if (defender.agility) {
            hitChance -= defender.agility * 0.5;
        }

        // Clamp hit chance between 5% and 95%
        hitChance = Utils.clamp(hitChance, 5, 95);

        // Roll for hit
        const roll = Utils.randomInt(1, 100);

        return roll <= hitChance;
    },

    /**
     * Determine if an attack is a critical hit
     * @param {Object} attacker - The attacking entity
     * @returns {boolean} True if the attack is a critical hit
     */
    checkCritical: function(attacker) {
        // Base critical chance
        let critChance = 5; // 5% base chance for critical

        // Adjust based on attacker's agility
        if (attacker === Player) {
            critChance += Math.floor(Player.agility * 0.5); // Each point adds 0.5% chance
        } else if (attacker.agility) {
            critChance += Math.floor(attacker.agility * 0.2);
        }

        // Clamp critical chance between 1% and 25%
        critChance = Utils.clamp(critChance, 1, 25);

        // Roll for critical
        const roll = Utils.randomInt(1, 100);

        return roll <= critChance;
    },

    /**
     * Calculate damage from attacker to defender
     * @param {Object} attacker - The attacking entity
     * @param {Object} defender - The defending entity
     * @param {boolean} isCritical - Whether the attack is a critical hit
     * @returns {number} Calculated damage
     */
    calculateDamage: function(attacker, defender, isCritical) {
        // Base damage
        let baseDamage = 1;

        if (attacker === Player) {
            baseDamage = Player.calculateAttackDamage();
        } else {
            baseDamage = attacker.damage || 1;
        }

        // Critical hit multiplier
        if (isCritical) {
            baseDamage = Math.floor(baseDamage * 1.5);
        }

        // Defender's defense
        let defense = 0;

        if (defender === Player) {
            // Calculate player's total defense from equipment
            if (Player.equipment.armor) {
                defense += Player.equipment.armor.defense || 0;
            }

            if (Player.equipment.helmet) {
                defense += Player.equipment.helmet.defense || 0;
            }
        } else {
            defense = defender.defense || 0;
        }

        // Final damage calculation (minimum 1 damage)
        return Math.max(1, baseDamage - defense);
    },

    /**
     * Process a ranged attack
     * @param {Object} attacker - The attacking entity
     * @param {Object} defender - The defending entity
     * @param {number} range - Distance between attacker and defender
     * @returns {boolean} True if the attack was successful
     */
    rangedAttack: function(attacker, defender, range) {
        // Penalty for longer ranges
        let rangePenalty = Math.max(0, range - 3) * 10; // -10% per tile beyond 3

        // Adjust hit chance based on range
        let hitChance = 85 - rangePenalty;

        // Clamp hit chance
        hitChance = Utils.clamp(hitChance, 5, 95);

        // Roll for hit
        const roll = Utils.randomInt(1, 100);

        if (roll > hitChance) {
            // Miss
            if (attacker === Player) {
                UI.addMessage("Your ranged attack misses!", 'combat');
            } else {
                UI.addMessage(`The ${attacker.name}'s ranged attack misses!`, 'combat');
            }
            return false;
        }

        // Hit - calculate and apply damage
        return this.attack(attacker, defender);
    },

    /**
     * Process effects of special attacks
     * @param {Object} attacker - The attacking entity
     * @param {Object} defender - The defending entity
     * @param {string} type - Type of special attack
     * @returns {boolean} True if the attack was successful
     */
    specialAttack: function(attacker, defender, type) {
        // Special attacks consume energy
        if (attacker === Player) {
            const energyCost = this.getSpecialAttackCost(type);

            if (Player.ep < energyCost) {
                UI.addMessage("Not enough energy for this special attack!", 'system');
                return false;
            }

            // Consume energy
            Player.ep -= energyCost;
        }

        // Process special attack based on type
        switch (type) {
            case 'power':
                // Power attack: More damage but lower accuracy
                return this.powerAttack(attacker, defender);

            case 'precise':
                // Precise attack: Higher accuracy and critical chance
                return this.preciseAttack(attacker, defender);

            case 'sweep':
                // Sweep attack: Hits multiple enemies (not implemented yet)
                return this.sweepAttack(attacker);

            default:
                console.error(`Unknown special attack type: ${type}`);
                return false;
        }
    },

    /**
     * Get energy cost for a special attack
     * @param {string} type - Type of special attack
     * @returns {number} Energy cost
     */
    getSpecialAttackCost: function(type) {
        switch (type) {
            case 'power': return 10;
            case 'precise': return 8;
            case 'sweep': return 15;
            default: return 10;
        }
    },

    /**
     * Execute a power attack
     * @param {Object} attacker - The attacking entity
     * @param {Object} defender - The defending entity
     * @returns {boolean} True if the attack was successful
     */
    powerAttack: function(attacker, defender) {
        // Lower accuracy, higher damage
        let hitChance = 70; // Lower than normal

        // Roll for hit
        const roll = Utils.randomInt(1, 100);

        if (roll > hitChance) {
            // Miss
            if (attacker === Player) {
                UI.addMessage("Your power attack misses!", 'combat');
            }
            return false;
        }

        // Calculate damage (1.8x normal damage)
        let damage = 0;

        if (attacker === Player) {
            damage = Math.floor(Player.calculateAttackDamage() * 1.8);
            UI.addMessage(`You hit with a powerful attack for ${damage} damage!`, 'combat');
            return Entities.damageEnemy(defender, damage);
        } else {
            damage = Math.floor(Entities.calculateEnemyDamage(attacker) * 1.8);
            return Player.takeDamage(damage);
        }
    },

    /**
     * Execute a precise attack
     * @param {Object} attacker - The attacking entity
     * @param {Object} defender - The defending entity
     * @returns {boolean} True if the attack was successful
     */
    preciseAttack: function(attacker, defender) {
        // Higher accuracy, higher critical chance
        let hitChance = 95; // Higher than normal

        // Roll for hit
        const roll = Utils.randomInt(1, 100);

        if (roll > hitChance) {
            // Miss
            if (attacker === Player) {
                UI.addMessage("Your precise attack misses!", 'combat');
            }
            return false;
        }

        // Higher critical chance (40%)
        const isCritical = Utils.randomInt(1, 100) <= 40;

        // Calculate damage
        let damage = 0;

        if (attacker === Player) {
            damage = Player.calculateAttackDamage();
            if (isCritical) {
                damage = Math.floor(damage * 2); // Double damage on critical with precise attack
                UI.addMessage(`Critical hit! Your precise attack deals ${damage} damage!`, 'combat');
            } else {
                UI.addMessage(`Your precise attack hits for ${damage} damage!`, 'combat');
            }
            return Entities.damageEnemy(defender, damage);
        } else {
            damage = Entities.calculateEnemyDamage(attacker);
            if (isCritical) {
                damage = Math.floor(damage * 2);
            }
            return Player.takeDamage(damage);
        }
    },

    /**
     * Execute a sweep attack (hits multiple enemies)
     * @param {Object} attacker - The attacking entity
     * @returns {boolean} True if at least one enemy was hit
     */
    sweepAttack: function(attacker) {
        if (attacker !== Player) {
            // Only player can use sweep attacks for now
            return false;
        }

        // Find all adjacent enemies
        const adjacentEnemies = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                // Skip the center (player's position)
                if (dx === 0 && dy === 0) continue;

                const enemy = Entities.getEntityAt(Player.x + dx, Player.y + dy);
                if (enemy && enemy.type === 'enemy') {
                    adjacentEnemies.push(enemy);
                }
            }
        }

        if (adjacentEnemies.length === 0) {
            UI.addMessage("No enemies in range for sweep attack!", 'combat');
            return false;
        }

        // Attack all adjacent enemies with reduced damage
        let damage = Math.floor(Player.calculateAttackDamage() * 0.7); // 70% damage
        let hitCount = 0;

        adjacentEnemies.forEach(enemy => {
            UI.addMessage(`Your sweep attack hits ${enemy.name} for ${damage} damage!`, 'combat');
            if (Entities.damageEnemy(enemy, damage)) {
                hitCount++;
            }
        });

        return hitCount > 0;
    }
};
