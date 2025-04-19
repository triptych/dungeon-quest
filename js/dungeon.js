/**
 * Dungeon Quest - Dungeon Generation
 * Procedural dungeon generation algorithms
 */

const Dungeon = {
    /** Dungeon grid data */
    grid: [],

    /** Dungeon properties */
    width: 0,
    height: 0,
    level: 1,

    /** Dungeon features */
    rooms: [],
    corridors: [],
    entrance: { x: 0, y: 0 },
    exit: { x: 0, y: 0 },

    /** Visibility grid */
    visible: [],
    explored: [],

    /** Cell types */
    CELL_TYPES: {
        WALL: 0,
        FLOOR: 1,
        DOOR: 2,
        ENTRANCE: 3,
        EXIT: 4
    },

    /**
     * Generate a new dungeon level
     * @param {number} width - Dungeon width
     * @param {number} height - Dungeon height
     * @param {number} level - Dungeon depth level
     */
    generate: function(width, height, level) {
        console.log(`Generating dungeon level ${level} (${width}x${height})`);

        // Initialize dungeon properties
        this.width = width;
        this.height = height;
        this.level = level;
        this.rooms = [];
        this.corridors = [];

        try {
            // Create empty grid filled with walls
            this.grid = [];
            for (let y = 0; y < height; y++) {
                this.grid[y] = [];
                for (let x = 0; x < width; x++) {
                    this.grid[y][x] = this.CELL_TYPES.WALL;
                }
            }

            // Initialize visibility grids manually to ensure they exist
            this.visible = [];
            this.explored = [];
            for (let y = 0; y < height; y++) {
                this.visible[y] = [];
                this.explored[y] = [];
                for (let x = 0; x < width; x++) {
                    this.visible[y][x] = false;
                    this.explored[y][x] = false;
                }
            }
        } catch (error) {
            console.error("Error initializing dungeon arrays:", error);
        }

        // Generate rooms using Binary Space Partitioning
        this.generateRooms();

        // Connect rooms with corridors
        this.generateCorridors();

        // Place entrance and exit
        this.placeEntranceAndExit();

        // Place doors
        this.placeDoors();

        // Place items, traps, etc. based on level
        this.populateDungeon();

        console.log(`Dungeon level ${level} generated successfully`);
    },

    /**
     * Generate rooms using Binary Space Partitioning (BSP)
     */
    generateRooms: function() {
        // Start with the whole dungeon as one partition
        const rootPartition = {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };

        // Split the space recursively
        const partitions = this.splitPartition(rootPartition, 4); // 4 levels of recursion

        // Create rooms within the partitions
        partitions.forEach(partition => {
            // Add some randomness to room size and position within partition
            const padding = 2;
            const roomWidth = Utils.randomInt(
                Math.min(7, partition.width - 2 * padding),
                Math.min(partition.width - 2 * padding, 12)
            );
            const roomHeight = Utils.randomInt(
                Math.min(5, partition.height - 2 * padding),
                Math.min(partition.height - 2 * padding, 10)
            );

            // Position the room with some randomness
            const roomX = partition.x + padding + Utils.randomInt(0, partition.width - roomWidth - 2 * padding);
            const roomY = partition.y + padding + Utils.randomInt(0, partition.height - roomHeight - 2 * padding);

            // Create the room
            const room = {
                x: roomX,
                y: roomY,
                width: roomWidth,
                height: roomHeight,
                centerX: Math.floor(roomX + roomWidth / 2),
                centerY: Math.floor(roomY + roomHeight / 2)
            };

            // Add the room to our list
            this.rooms.push(room);

            // Carve the room into the grid
            for (let y = room.y; y < room.y + room.height; y++) {
                for (let x = room.x; x < room.x + room.width; x++) {
                    if (Utils.isInBounds(x, y, this.width, this.height)) {
                        // Ensure the grid row exists before setting a value
                        if (!this.grid[y]) {
                            this.grid[y] = [];
                        }
                        this.grid[y][x] = this.CELL_TYPES.FLOOR;
                    }
                }
            }
        });

        console.log(`Generated ${this.rooms.length} rooms`);
    },

    /**
     * Recursively split a partition into smaller partitions
     * @param {Object} partition - The partition to split
     * @param {number} depth - Current recursion depth
     * @returns {Array} Array of partitions
     */
    splitPartition: function(partition, depth) {
        if (depth === 0 || partition.width < 20 || partition.height < 20) {
            return [partition];
        }

        const partitions = [];

        // Decide whether to split horizontally or vertically
        const splitHorizontally = Math.random() < 0.5;

        if (splitHorizontally) {
            // Split horizontally
            const splitY = partition.y + Utils.randomInt(
                partition.height * 0.3,
                partition.height * 0.7
            );

            // Create two new partitions
            const topPartition = {
                x: partition.x,
                y: partition.y,
                width: partition.width,
                height: splitY - partition.y
            };

            const bottomPartition = {
                x: partition.x,
                y: splitY,
                width: partition.width,
                height: partition.height - (splitY - partition.y)
            };

            // Recursively split these partitions
            partitions.push(...this.splitPartition(topPartition, depth - 1));
            partitions.push(...this.splitPartition(bottomPartition, depth - 1));
        } else {
            // Split vertically
            const splitX = partition.x + Utils.randomInt(
                partition.width * 0.3,
                partition.width * 0.7
            );

            // Create two new partitions
            const leftPartition = {
                x: partition.x,
                y: partition.y,
                width: splitX - partition.x,
                height: partition.height
            };

            const rightPartition = {
                x: splitX,
                y: partition.y,
                width: partition.width - (splitX - partition.x),
                height: partition.height
            };

            // Recursively split these partitions
            partitions.push(...this.splitPartition(leftPartition, depth - 1));
            partitions.push(...this.splitPartition(rightPartition, depth - 1));
        }

        return partitions;
    },

    /**
     * Generate corridors to connect rooms
     */
    generateCorridors: function() {
        // Connect rooms using a simple approach
        // For each room (except the first), connect to the previous room
        for (let i = 1; i < this.rooms.length; i++) {
            const roomA = this.rooms[i - 1];
            const roomB = this.rooms[i];

            // Connect the centers of the rooms
            this.createCorridor(roomA.centerX, roomA.centerY, roomB.centerX, roomB.centerY);
        }

        // Add some additional connections for loops (about 20% of the number of rooms)
        const additionalConnections = Math.floor(this.rooms.length * 0.2);
        for (let i = 0; i < additionalConnections; i++) {
            // Select two random rooms
            const roomA = this.rooms[Utils.randomInt(0, this.rooms.length - 1)];
            const roomB = this.rooms[Utils.randomInt(0, this.rooms.length - 1)];

            // Skip if same room
            if (roomA === roomB) continue;

            // Connect them
            this.createCorridor(roomA.centerX, roomA.centerY, roomB.centerX, roomB.centerY);
        }
    },

    /**
     * Create a corridor between two points using an L-shaped path
     * @param {number} x1 - Start x coordinate
     * @param {number} y1 - Start y coordinate
     * @param {number} x2 - End x coordinate
     * @param {number} y2 - End y coordinate
     */
    createCorridor: function(x1, y1, x2, y2) {
        // Create a corridor using an L-shaped path
        const corridor = {
            startX: x1,
            startY: y1,
            endX: x2,
            endY: y2
        };

        this.corridors.push(corridor);

        // Decide on the corner position (horizontal first, then vertical)
        const cornerX = x2;
        const cornerY = y1;

        // Carve the horizontal part
        const startX = Math.min(x1, cornerX);
        const endX = Math.max(x1, cornerX);
        for (let x = startX; x <= endX; x++) {
            if (Utils.isInBounds(x, y1, this.width, this.height)) {
                // Make sure the grid row exists before setting the cell type
                if (!this.grid[y1]) {
                    this.grid[y1] = [];
                }
                this.grid[y1][x] = this.CELL_TYPES.FLOOR;
            }
        }

        // Carve the vertical part
        const startY = Math.min(cornerY, y2);
        const endY = Math.max(cornerY, y2);
        for (let y = startY; y <= endY; y++) {
            if (Utils.isInBounds(cornerX, y, this.width, this.height)) {
                // Make sure the grid and the row exist before setting the cell type
                if (!this.grid[y]) {
                    this.grid[y] = [];
                }
                this.grid[y][cornerX] = this.CELL_TYPES.FLOOR;
            }
        }
    },

    /**
     * Place entrance and exit in the dungeon
     */
    placeEntranceAndExit: function() {
        // Place entrance in the first room
        const entranceRoom = this.rooms[0];
        this.entrance = {
            x: entranceRoom.centerX,
            y: entranceRoom.centerY
        };

        // Ensure the grid row exists
        if (!this.grid[this.entrance.y]) {
            this.grid[this.entrance.y] = [];
        }
        this.grid[this.entrance.y][this.entrance.x] = this.CELL_TYPES.ENTRANCE;

        // Place exit in the last room
        const exitRoom = this.rooms[this.rooms.length - 1];
        this.exit = {
            x: exitRoom.centerX,
            y: exitRoom.centerY
        };

        // Ensure the grid row exists
        if (!this.grid[this.exit.y]) {
            this.grid[this.exit.y] = [];
        }
        this.grid[this.exit.y][this.exit.x] = this.CELL_TYPES.EXIT;
    },

    /**
     * Place doors at corridor-room intersections
     */
    placeDoors: function() {
        // Check potential door locations at corridor endpoints
        this.corridors.forEach(corridor => {
            // Check at the start point
            this.tryPlaceDoor(corridor.startX, corridor.startY);

            // Check at the end point
            this.tryPlaceDoor(corridor.endX, corridor.endY);
        });
    },

    /**
     * Try to place a door at a given position if it's suitable
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    tryPlaceDoor: function(x, y) {
        // A door needs a wall above and below, or to the left and right
        const hasWallsVertical =
            this.getCellType(x, y - 1) === this.CELL_TYPES.WALL &&
            this.getCellType(x, y + 1) === this.CELL_TYPES.WALL;

        const hasWallsHorizontal =
            this.getCellType(x - 1, y) === this.CELL_TYPES.WALL &&
            this.getCellType(x + 1, y) === this.CELL_TYPES.WALL;

        // Check if this would be a good spot for a door
        if ((hasWallsVertical || hasWallsHorizontal) &&
            this.getCellType(x, y) === this.CELL_TYPES.FLOOR) {
            // 30% chance of placing a door
            if (Math.random() < 0.3) {
                // Ensure the grid row exists
                if (!this.grid[y]) {
                    this.grid[y] = [];
                }
                this.grid[y][x] = this.CELL_TYPES.DOOR;
            }
        }
    },

    /**
     * Safely get cell type at coordinates, returns WALL for out of bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Cell type constant
     */
    getCellType: function(x, y) {
        if (Utils.isInBounds(x, y, this.width, this.height)) {
            // Check if the grid row exists
            if (!this.grid[y]) {
                return this.CELL_TYPES.WALL; // Treat as wall if row doesn't exist
            }
            return this.grid[y][x] !== undefined ? this.grid[y][x] : this.CELL_TYPES.WALL;
        }
        return this.CELL_TYPES.WALL; // Consider out of bounds as walls
    },

    /**
     * Populate the dungeon with items, traps, etc.
     */
    populateDungeon: function() {
        // This will be implemented later with the items system
        // For now, we're just generating the basic dungeon structure
    },

    /**
     * Update visibility grid based on player position
     * @param {number} playerX - Player x coordinate
     * @param {number} playerY - Player y coordinate
     * @param {number} radius - Visibility radius
     */
    updateVisibility: function(playerX, playerY, radius) {
        try {
            // Reset visibility grid manually
            this.visible = [];
            for (let y = 0; y < this.height; y++) {
                this.visible[y] = [];
                for (let x = 0; x < this.width; x++) {
                    this.visible[y][x] = false;
                }
            }

            // Make sure explored grid is initialized
            if (!this.explored || !this.explored.length) {
                this.explored = [];
                for (let y = 0; y < this.height; y++) {
                    this.explored[y] = [];
                    for (let x = 0; x < this.width; x++) {
                        this.explored[y][x] = false;
                    }
                }
            }

            // Mark cells as visible using a simple circle algorithm
            for (let y = playerY - radius; y <= playerY + radius; y++) {
                for (let x = playerX - radius; x <= playerX + radius; x++) {
                    if (Utils.isInBounds(x, y, this.width, this.height)) {
                        // Simple distance check for now (will be replaced with proper FOV)
                        const distance = Utils.gridDistance(playerX, playerY, x, y);
                        if (distance <= radius) {
                            if (!this.visible[y]) this.visible[y] = [];
                            if (!this.explored[y]) this.explored[y] = [];

                            this.visible[y][x] = true;
                            this.explored[y][x] = true;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error updating visibility:", error);
        }
    },

    /**
     * Check if a position is walkable
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @returns {boolean} True if walkable
     */
    isWalkable: function(x, y) {
        if (!Utils.isInBounds(x, y, this.width, this.height)) {
            return false;
        }

        // Check if the grid row exists
        if (!this.grid[y]) {
            return false;
        }

        const cellType = this.grid[y][x];
        return (
            cellType === this.CELL_TYPES.FLOOR ||
            cellType === this.CELL_TYPES.DOOR ||
            cellType === this.CELL_TYPES.ENTRANCE ||
            cellType === this.CELL_TYPES.EXIT
        );
    },

    /**
     * Get data needed for saving the game
     * @returns {Object} Save data
     */
    getSaveData: function() {
        return {
            grid: this.grid,
            width: this.width,
            height: this.height,
            level: this.level,
            rooms: this.rooms,
            corridors: this.corridors,
            entrance: this.entrance,
            exit: this.exit,
            explored: this.explored
        };
    },

    /**
     * Load dungeon from save data
     * @param {Object} data - Save data
     */
    loadSaveData: function(data) {
        this.grid = data.grid;
        this.width = data.width;
        this.height = data.height;
        this.level = data.level;
        this.rooms = data.rooms;
        this.corridors = data.corridors;
        this.entrance = data.entrance;
        this.exit = data.exit;
        this.explored = data.explored;

        try {
            // Re-initialize visibility grid manually
            this.visible = [];
            for (let y = 0; y < this.height; y++) {
                this.visible[y] = [];
                for (let x = 0; x < this.width; x++) {
                    this.visible[y][x] = false;
                }
            }

            // Make sure explored is properly initialized
            if (!this.explored || !this.explored.length) {
                this.explored = [];
                for (let y = 0; y < this.height; y++) {
                    this.explored[y] = [];
                    for (let x = 0; x < this.width; x++) {
                        this.explored[y][x] = false;
                    }
                }
            }
        } catch (error) {
            console.error("Error initializing visibility in loadSaveData:", error);
        }
    }
};
