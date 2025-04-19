/**
 * Dungeon Quest - Items System
 * Handles item creation, management, and effects
 */

const Items = {
    /** Array of all items in the dungeon */
    items: [],

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
     * @param {string} type - Item type (weapon, armor, potion, etc.)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} properties - Additional item properties
     * @returns {Object} The created item
     */
    createItem: function(type, x, y, properties = {}) {
        const item = {
            type: type,
            x: x,
            y: y,
            name: properties.name || `${type}`,
            description: properties.description || `A ${type}`,
            ...properties
        };

        this.items.push(item);
        return item;
    },

    /**
     * Populate the dungeon with items based on the level
     * @param {Object} dungeon - The dungeon object
     * @param {number} level - Dungeon level
     */
    populateDungeon: function(dungeon, level) {
        // This will be implemented later to add items to dungeon rooms
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
