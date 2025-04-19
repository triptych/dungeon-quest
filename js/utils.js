/**
 * Dungeon Quest - Utility Functions
 * Collection of helper functions used throughout the game
 */

const Utils = {
    /**
     * Generate a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Calculate distance between two points on a grid
     * @param {number} x1 - First point x coordinate
     * @param {number} y1 - First point y coordinate
     * @param {number} x2 - Second point x coordinate
     * @param {number} y2 - Second point y coordinate
     * @returns {number} Distance
     */
    gridDistance: function(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    },

    /**
     * Check if value is in range (inclusive)
     * @param {number} value - Value to check
     * @param {number} min - Minimum of range
     * @param {number} max - Maximum of range
     * @returns {boolean} True if value is in range
     */
    inRange: function(value, min, max) {
        return value >= min && value <= max;
    },

    /**
     * Create a DOM element with attributes and content
     * @param {string} tagName - Type of element to create
     * @param {Object} attributes - Key-value pairs of attributes
     * @param {string|HTMLElement} content - Text content or child element
     * @returns {HTMLElement} Created element
     */
    createElement: function(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);

        // Set attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        }

        // Set content
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }

        return element;
    },

    /**
     * Remove all child elements from a parent element
     * @param {HTMLElement} element - Parent element to clear
     */
    clearElement: function(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    /**
     * Create a 2D array filled with a default value
     * @param {number} width - Width of array
     * @param {number} height - Height of array
     * @param {*} defaultValue - Default value for each cell
     * @returns {Array} 2D array
     */
    create2DArray: function(width, height, defaultValue) {
        return Array(height).fill().map(() => Array(width).fill(defaultValue));
    },

    /**
     * Save data to local storage
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be JSON stringified)
     */
    saveToStorage: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    },

    /**
     * Load data from local storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed data or default value
     */
    loadFromStorage: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading from local storage:', error);
            return defaultValue;
        }
    },

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Check if a point is within bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width of bounds
     * @param {number} height - Height of bounds
     * @returns {boolean} True if point is in bounds
     */
    isInBounds: function(x, y, width, height) {
        return x >= 0 && x < width && y >= 0 && y < height;
    }
};
