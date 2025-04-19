/**
 * Dungeon Quest - Items System
 * Handles item creation, management, and effects
 */

const Items = {
    /** Array of all items in the dungeon */
    items: [],

    /** Item categories and their properties */
    categories: {
        weapon: {
            slots: ['mainHand', 'offHand'],
            stats: ['damage', 'critChance', 'attackSpeed'],
            types: ['sword', 'axe', 'mace', 'dagger', 'staff', 'wand', 'bow']
        },
        armor: {
            slots: ['head', 'chest', 'legs', 'feet'],
            stats: ['defense', 'magicResist', 'healthBonus'],
            types: ['cloth', 'leather', 'mail', 'plate']
        },
        accessory: {
            slots: ['ring', 'amulet', 'trinket'],
            stats: ['allStats', 'specialEffect'],
            types: ['common', 'magical', 'rare', 'unique']
        },
        consumable: {
            slots: ['inventory'],
            stats: ['potency', 'duration'],
            types: ['healthPotion', 'energyPotion', 'elixir', 'scroll', 'food']
        },
        charm: {
            slots: ['charm'],
            stats: ['effectBonus', 'specialProperty'],
            types: ['lucky', 'warding', 'elemental', 'skill']
        }
    },

    /** Rarity levels and their modifiers */
    rarities: {
        common: {
            color: '#FFFFFF',
            statMultiplier: 1.0,
            chance: 0.70
        },
        uncommon: {
            color: '#00CC00',
            statMultiplier: 1.25,
            chance: 0.20
        },
        rare: {
            color: '#0066FF',
            statMultiplier: 1.5,
            chance: 0.08
        },
        epic: {
            color: '#9900FF',
            statMultiplier: 2.0,
            chance: 0.02
        },
        legendary: {
            color: '#FF9900',
            statMultiplier: 3.0,
            chance: 0.005
        }
    },

    /**
     * Initialize the items system
     */
    init: function() {
        console.log('Initializing items system');
        this.items = [];
    },

    /**
     * Get item at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Item object or null if none found
     */
    getItemAt: function(x, y) {
        return this.items.find(item => item.x === x && item.y === y) || null;
    },

    /**
     * Remove an item from a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if item was removed
     */
    removeItemAt: function(x, y) {
        const index = this.items.findIndex(item => item.x === x && item.y === y);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    },

    /**
     * Add an item to the dungeon at a specific position
     * @param {string} category - Item category (weapon, armor, consumable, etc.)
     * @param {string} type - Specific type within the category (sword, plate, healthPotion, etc.)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} rarity - Item rarity (common, uncommon, rare, epic, legendary)
     * @param {number} level - Item level (affects stats)
     * @param {Object} properties - Additional item properties
     * @returns {Object} The created item
     */
    createItem: function(category, type, x, y, rarity = 'common', level = 1, properties = {}) {
        // Validate category and type
        if (!this.categories[category]) {
            console.error(`Invalid item category: ${category}`);
            return null;
        }

        if (!this.categories[category].types.includes(type)) {
            console.warn(`Non-standard item type: ${type} for category: ${category}`);
        }

        // Validate rarity
        if (!this.rarities[rarity]) {
            console.warn(`Invalid rarity: ${rarity}, defaulting to common`);
            rarity = 'common';
        }

        // Generate name if not provided
        const name = properties.name || this.generateItemName(category, type, rarity);

        // Calculate base stats based on item level and rarity
        const baseStats = this.calculateBaseStats(category, type, level, rarity);

        const item = {
            id: this.generateItemId(),
            category: category,
            type: type,
            x: x,
            y: y,
            level: level,
            rarity: rarity,
            name: name,
            description: properties.description || this.generateDescription(category, type, rarity, baseStats),
            stats: { ...baseStats, ...(properties.stats || {}) },
            value: this.calculateValue(category, rarity, level),
            slot: this.determineEquipSlot(category, type, properties.slot),
            isIdentified: properties.isIdentified !== undefined ? properties.isIdentified : (rarity === 'common'),
            durability: properties.durability || this.calculateDurability(category, rarity),
            maxDurability: properties.maxDurability || this.calculateDurability(category, rarity),
            effects: properties.effects || [],
            icon: properties.icon || this.getItemIcon(category, type),
            ...properties
        };

        this.items.push(item);
        return item;
    },

    /**
     * Generate a unique ID for an item
     * @returns {string} Unique item ID
     */
    generateItemId: function() {
        return 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    },

    /**
     * Generate a name for an item based on its properties
     * @param {string} category - Item category
     * @param {string} type - Item type
     * @param {string} rarity - Item rarity
     * @returns {string} Generated item name
     */
    generateItemName: function(category, type, rarity) {
        // Arrays of prefixes and suffixes for different rarities
        const prefixes = {
            common: ['Basic', 'Simple', 'Crude', 'Plain'],
            uncommon: ['Sturdy', 'Quality', 'Fine', 'Solid'],
            rare: ['Superior', 'Excellent', 'Reinforced', 'Masterwork'],
            epic: ['Magnificent', 'Glorious', 'Mythical', 'Legendary'],
            legendary: ['Ancient', 'Divine', 'Celestial', 'Godly']
        };

        const suffixes = {
            weapon: ['of Power', 'of Might', 'of Slaying', 'of Battle'],
            armor: ['of Protection', 'of Warding', 'of Shielding', 'of Defense'],
            accessory: ['of Fortune', 'of Insight', 'of Vision', 'of Spirit'],
            consumable: ['of Restoration', 'of Recovery', 'of Healing', 'of Vigor'],
            charm: ['of Luck', 'of Wisdom', 'of Magic', 'of Mystery']
        };

        // Format the type name nicely
        const formattedType = type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        // Common items just get a simple name
        if (rarity === 'common') {
            return formattedType;
        }

        // Choose random prefix and suffix
        const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
        const suffix = rarity === 'legendary' ?
            suffixes[category][Math.floor(Math.random() * suffixes[category].length)] : '';

        return `${prefix} ${formattedType}${suffix}`;
    },

    /**
     * Generate a description for an item
     * @param {string} category - Item category
     * @param {string} type - Item type
     * @param {string} rarity - Item rarity
     * @param {Object} stats - Item stats
     * @returns {string} Generated description
     */
    generateDescription: function(category, type, rarity, stats) {
        let description = '';

        // Generic descriptions based on category
        const categoryDescriptions = {
            weapon: 'A weapon used for combat.',
            armor: 'Protective gear to defend against attacks.',
            accessory: 'An item that provides special benefits when equipped.',
            consumable: 'A one-time use item that provides temporary effects.',
            charm: 'A magical item that brings good fortune or protection.'
        };

        // More specific descriptions based on type
        const typeDescriptions = {
            // Weapons
            sword: 'A balanced weapon with moderate damage and speed.',
            axe: 'A heavy weapon that deals high damage but is slower to swing.',
            mace: 'A blunt weapon effective against armored foes.',
            dagger: 'A fast weapon that can strike quickly for critical hits.',
            staff: 'A magical implement that enhances spellcasting abilities.',
            wand: 'A precise magical tool for focused spellcasting.',
            bow: 'A ranged weapon for attacking enemies from a distance.',

            // Armor
            cloth: 'Light armor that offers minimal protection but doesn\'t hinder movement.',
            leather: 'Medium armor offering a balance of protection and mobility.',
            mail: 'Heavy armor that provides good protection at the cost of agility.',
            plate: 'The heaviest armor, offering maximum protection but reducing mobility.',

            // Consumables
            healthPotion: 'Restores health when consumed.',
            energyPotion: 'Restores energy when consumed.',
            elixir: 'A powerful potion that provides multiple benefits.',
            scroll: 'Contains a spell that activates when read.',
            food: 'Restores health slowly over time when eaten.'
        };

        // Rarity-based descriptions
        const rarityDescriptions = {
            common: 'A common item of ordinary quality.',
            uncommon: 'An item of above-average quality.',
            rare: 'A rare item with superior craftsmanship.',
            epic: 'An extraordinary item of remarkable quality.',
            legendary: 'A legendary item of immense power and historical significance.'
        };

        // Combine descriptions
        description = typeDescriptions[type] || categoryDescriptions[category];

        // Add rarity description
        description += ' ' + rarityDescriptions[rarity];

        // For non-common items, add a hint about their stats
        if (rarity !== 'common') {
            const statKeys = Object.keys(stats);
            if (statKeys.length > 0) {
                const primaryStat = statKeys[0];
                description += ` It provides ${stats[primaryStat]} ${primaryStat}.`;
            }
        }

        return description;
    },

    /**
     * Calculate base stats for an item based on its properties
     * @param {string} category - Item category
     * @param {string} type - Item type
     * @param {number} level - Item level
     * @param {string} rarity - Item rarity
     * @returns {Object} Calculated base stats
     */
    calculateBaseStats: function(category, type, level, rarity) {
        const stats = {};
        const rarityMultiplier = this.rarities[rarity].statMultiplier;
        const levelFactor = 1 + (level - 1) * 0.1; // 10% increase per level

        // Get relevant stats for this category
        const relevantStats = this.categories[category].stats;

        // Generate base values for each relevant stat
        relevantStats.forEach(stat => {
            // Base value calculation varies by stat
            let baseValue = 0;

            switch(stat) {
                case 'damage':
                    baseValue = 5 + (level * 2);
                    // Adjust for weapon type
                    if (type === 'dagger') baseValue *= 0.8;
                    if (type === 'axe' || type === 'mace') baseValue *= 1.2;
                    break;

                case 'defense':
                    baseValue = 2 + level;
                    // Adjust for armor type
                    if (type === 'cloth') baseValue *= 0.6;
                    if (type === 'leather') baseValue *= 0.8;
                    if (type === 'mail') baseValue *= 1.2;
                    if (type === 'plate') baseValue *= 1.5;
                    break;

                case 'healthBonus':
                    baseValue = 5 + (level * 3);
                    break;

                case 'potency':
                    baseValue = 10 + (level * 5);
                    break;

                case 'critChance':
                    baseValue = 5; // Base 5%
                    // Adjust for weapon type
                    if (type === 'dagger') baseValue += 5;
                    break;

                default:
                    baseValue = 1 + level;
            }

            // Apply rarity and level multipliers
            stats[stat] = Math.round(baseValue * rarityMultiplier * levelFactor);
        });

        return stats;
    },

    /**
     * Calculate the gold value of an item
     * @param {string} category - Item category
     * @param {string} rarity - Item rarity
     * @param {number} level - Item level
     * @returns {number} Item value in gold
     */
    calculateValue: function(category, rarity, level) {
        // Base values by category
        const baseCategoryValues = {
            weapon: 10,
            armor: 12,
            accessory: 15,
            consumable: 5,
            charm: 20
        };

        // Rarity multipliers
        const rarityValueMultipliers = {
            common: 1,
            uncommon: 2,
            rare: 5,
            epic: 15,
            legendary: 50
        };

        // Calculate final value
        const baseValue = baseCategoryValues[category] || 10;
        const rarityMultiplier = rarityValueMultipliers[rarity] || 1;
        const levelMultiplier = level * 1.5;

        return Math.round(baseValue * rarityMultiplier * levelMultiplier);
    },

    /**
     * Determine which equipment slot an item can be equipped in
     * @param {string} category - Item category
     * @param {string} type - Item type
     * @param {string} overrideSlot - Slot override from properties
     * @returns {string} Equipment slot
     */
    determineEquipSlot: function(category, type, overrideSlot) {
        // If slot is explicitly provided, use that
        if (overrideSlot) {
            return overrideSlot;
        }

        // Otherwise determine based on category and type
        switch(category) {
            case 'weapon':
                if (type === 'bow' || type === 'staff') return 'twoHand';
                if (type === 'dagger' || type === 'wand') return 'oneHand';
                return 'mainHand'; // Default for other weapons

            case 'armor':
                if (type === 'cloth' || type === 'leather' || type === 'mail' || type === 'plate') {
                    return 'chest'; // Default to chest slot
                }
                return 'chest';

            case 'accessory':
                if (type === 'ring') return 'ring';
                if (type === 'amulet') return 'neck';
                return 'trinket';

            case 'consumable':
                return 'inventory';

            case 'charm':
                return 'charm';

            default:
                return 'inventory';
        }
    },

    /**
     * Calculate item durability based on category and rarity
     * @param {string} category - Item category
     * @param {string} rarity - Item rarity
     * @returns {number} Durability value
     */
    calculateDurability: function(category, rarity) {
        // Consumables don't have durability
        if (category === 'consumable') {
            return 1; // One-time use
        }

        // Base durability by category
        const baseDurability = {
            weapon: 100,
            armor: 120,
            accessory: 150,
            charm: 200
        }[category] || 100;

        // Rarity bonuses
        const rarityMultiplier = {
            common: 1.0,
            uncommon: 1.2,
            rare: 1.5,
            epic: 2.0,
            legendary: 3.0
        }[rarity] || 1.0;

        return Math.round(baseDurability * rarityMultiplier);
    },

    /**
     * Get the appropriate icon for an item
     * @param {string} category - Item category
     * @param {string} type - Item type
     * @returns {string} Icon identifier
     */
    getItemIcon: function(category, type) {
        // This would normally return paths to icons, but for now we'll use placeholders
        return `${category}_${type}`;
    },

    /**
     * Populate the dungeon with items based on the level
     * @param {Object} dungeon - The dungeon object
     * @param {number} level - Dungeon level
     */
    populateDungeon: function(dungeon, level) {
        console.log(`Populating dungeon level ${level} with items`);

        // Calculate how many items to place based on dungeon level and room count
        const roomCount = dungeon.rooms.length;
        const baseItemCount = Math.floor(roomCount * 0.7); // 70% of rooms have items
        const levelBonus = Math.floor(level * 0.5); // More items on deeper levels
        const itemCount = baseItemCount + levelBonus;

        console.log(`Placing ${itemCount} items in ${roomCount} rooms`);

        // Track rooms that have been used to avoid overloading any single room
        const usedRooms = new Set();

        // Place items
        for (let i = 0; i < itemCount; i++) {
            // Select a random room that hasn't been used too much
            let room;
            let attempts = 0;

            do {
                const roomIndex = Math.floor(Math.random() * roomCount);
                room = dungeon.rooms[roomIndex];
                attempts++;

                // After many attempts, allow reuse of rooms
                if (attempts > 20) {
                    break;
                }
            } while (usedRooms.has(room.id) && usedRooms.size < roomCount);

            // Mark room as used
            if (room) {
                usedRooms.add(room.id);

                // Find a valid position within the room
                const x = Math.floor(room.x + 1 + Math.random() * (room.width - 2));
                const y = Math.floor(room.y + 1 + Math.random() * (room.height - 2));

                // Generate an item appropriate for this level
                this.generateLevelAppropriateItem(x, y, level);
            }
        }
    },

    /**
     * Generate an item appropriate for the current dungeon level
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} level - Dungeon level
     * @returns {Object} The created item
     */
    generateLevelAppropriateItem: function(x, y, level) {
        // Determine item category probabilities based on level
        const categoryProbs = {
            weapon: 0.2,
            armor: 0.25,
            accessory: 0.15,
            consumable: 0.3,
            charm: 0.1
        };

        // Select a random category based on probabilities
        const categoryRoll = Math.random();
        let selectedCategory = 'consumable'; // Default
        let accumProb = 0;

        for (const [category, prob] of Object.entries(categoryProbs)) {
            accumProb += prob;
            if (categoryRoll <= accumProb) {
                selectedCategory = category;
                break;
            }
        }

        // Select a random type from the chosen category
        const possibleTypes = this.categories[selectedCategory].types;
        const selectedType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

        // Determine rarity based on level and random chance
        const rarityRoll = Math.random();
        let selectedRarity = 'common'; // Default

        // Higher level dungeons have better chances for rare items
        const levelFactor = Math.min(0.5, level * 0.05); // Caps at +50% chance at level 10

        // Adjusted chances with level factor
        if (rarityRoll < this.rarities.legendary.chance + levelFactor * 0.01) {
            selectedRarity = 'legendary';
        } else if (rarityRoll < this.rarities.epic.chance + levelFactor * 0.05) {
            selectedRarity = 'epic';
        } else if (rarityRoll < this.rarities.rare.chance + levelFactor * 0.1) {
            selectedRarity = 'rare';
        } else if (rarityRoll < this.rarities.uncommon.chance + levelFactor * 0.2) {
            selectedRarity = 'uncommon';
        }

        // Create the item with appropriate level (may be lower or higher than dungeon level)
        const itemLevel = Math.max(1, level + Math.floor(Math.random() * 3) - 1);

        // Special properties based on rarity
        const specialProperties = {};

        // Legendary and epic items might have special effects
        if (selectedRarity === 'legendary' || selectedRarity === 'epic') {
            specialProperties.effects = this.generateSpecialEffects(selectedCategory,
                selectedRarity === 'legendary' ? 2 : 1);
        }

        // Create and return the item
        return this.createItem(
            selectedCategory,
            selectedType,
            x,
            y,
            selectedRarity,
            itemLevel,
            specialProperties
        );
    },

    /**
     * Generate special effects for high-rarity items
     * @param {string} category - Item category
     * @param {number} count - Number of effects to generate
     * @returns {Array} Array of special effect objects
     */
    generateSpecialEffects: function(category, count) {
        const possibleEffects = [
            { name: 'Fiery', description: 'Deals additional fire damage', modifier: { damage: '+3', type: 'fire' } },
            { name: 'Freezing', description: 'Has a chance to slow enemies', modifier: { slow: '20%', duration: 2 } },
            { name: 'Vampiric', description: 'Heals for a portion of damage dealt', modifier: { lifeSteal: '10%' } },
            { name: 'Swift', description: 'Increases attack speed', modifier: { attackSpeed: '+15%' } },
            { name: 'Fortified', description: 'Increases maximum health', modifier: { healthBonus: '+20' } },
            { name: 'Lucky', description: 'Increases critical hit chance', modifier: { critChance: '+5%' } },
            { name: 'Thorned', description: 'Reflects damage to attackers', modifier: { damageReflection: '10%' } },
            { name: 'Arcane', description: 'Reduces energy cost of abilities', modifier: { energyCost: '-10%' } }
        ];

        // Filter effects that make sense for this category
        const categoryEffects = possibleEffects.filter(effect => {
            if (category === 'weapon' && 'damage' in effect.modifier) return true;
            if (category === 'armor' && ('healthBonus' in effect.modifier || 'damageReflection' in effect.modifier)) return true;
            if (category === 'accessory') return true; // Accessories can have any effect
            if (category === 'charm' && !('damage' in effect.modifier)) return true;
            return false;
        });

        // Select random effects
        const selectedEffects = [];
        for (let i = 0; i < count && categoryEffects.length > 0; i++) {
            const index = Math.floor(Math.random() * categoryEffects.length);
            selectedEffects.push(categoryEffects[index]);
            categoryEffects.splice(index, 1); // Remove so we don't pick it twice
        }

        return selectedEffects;
    },

    /**
     * Apply an item's effect (used for consumables)
     * @param {Object} item - The item to use
     * @param {Object} target - The target (usually the player)
     * @returns {boolean} True if the item was used successfully
     */
    useItem: function(item, target) {
        if (!item || !target) {
            console.error('Invalid item or target for useItem');
            return false;
        }

        // Only consumables can be used this way
        if (item.category !== 'consumable') {
            console.warn(`Attempted to use non-consumable item: ${item.name}`);
            return false;
        }

        let used = false;

        // Apply effect based on type
        switch(item.type) {
            case 'healthPotion':
                const healthAmount = item.stats.potency || 20;
                if (target.health < target.maxHealth) {
                    target.health = Math.min(target.maxHealth, target.health + healthAmount);
                    used = true;
                    console.log(`${target.name} restored ${healthAmount} health from ${item.name}`);
                }
                break;

            case 'energyPotion':
                const energyAmount = item.stats.potency || 15;
                if (target.energy < target.maxEnergy) {
                    target.energy = Math.min(target.maxEnergy, target.energy + energyAmount);
                    used = true;
                    console.log(`${target.name} restored ${energyAmount} energy from ${item.name}`);
                }
                break;

            case 'elixir':
                // Elixirs restore both health and energy
                const elixirHealth = Math.floor(item.stats.potency * 0.7) || 15;
                const elixirEnergy = Math.floor(item.stats.potency * 0.5) || 10;

                let healthRestored = 0;
                let energyRestored = 0;

                if (target.health < target.maxHealth) {
                    healthRestored = Math.min(target.maxHealth - target.health, elixirHealth);
                    target.health += healthRestored;
                }

                if (target.energy < target.maxEnergy) {
                    energyRestored = Math.min(target.maxEnergy - target.energy, elixirEnergy);
                    target.energy += energyRestored;
                }

                used = (healthRestored > 0 || energyRestored > 0);
                if (used) {
                    console.log(`${target.name} restored ${healthRestored} health and ${energyRestored} energy from ${item.name}`);
                }
                break;

            case 'scroll':
                // Scrolls might have various effects defined in their properties
                if (item.effects && item.effects.length > 0) {
                    // Apply each effect
                    item.effects.forEach(effect => {
                        if (effect.modifier) {
                            const keys = Object.keys(effect.modifier);
                            keys.forEach(key => {
                                // Apply temporary buff
                                if (!target.buffs) target.buffs = [];

                                target.buffs.push({
                                    stat: key,
                                    value: effect.modifier[key],
                                    duration: item.stats.duration || 5,
                                    source: item.name
                                });

                                console.log(`${target.name} gained ${effect.name} effect from ${item.name}`);
                            });
                        }
                    });
                    used = true;
                }
                break;

            case 'food':
                // Food restores health over time
                const foodHealing = item.stats.potency || 30;
                const healPerTurn = Math.ceil(foodHealing / (item.stats.duration || 5));

                if (!target.buffs) target.buffs = [];
                target.buffs.push({
                    stat: 'healthRegen',
                    value: healPerTurn,
                    duration: item.stats.duration || 5,
                    source: item.name
                });

                used = true;
                console.log(`${target.name} is eating ${item.name} for ${healPerTurn} health per turn over ${item.stats.duration || 5} turns`);
                break;

            default:
                console.warn(`Unknown consumable type: ${item.type}`);
                return false;
        }

        return used;
    },

    /**
     * Get data for saving
     * @returns {Array} Items data
     */
    getSaveData: function() {
        return this.items;
    },

    /**
     * Load items from save data
     * @param {Array} data - Items data
     */
    loadSaveData: function(data) {
        this.items = data || [];
    }
};
