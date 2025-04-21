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
    theme: 'cave', // Default theme

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
        EXIT: 4,
        WATER: 5,
        LAVA: 6,
        CHASM: 7,
        PILLAR: 8,
        RUBBLE: 9,
        ALTAR: 10
    },

    /** Dungeon themes */
    THEMES: {
        CAVE: 'cave',
        CRYPT: 'crypt',
        RUINS: 'ruins',
        DUNGEON: 'dungeon',
        SEWER: 'sewer'
    },

    /** Room templates for different themes */
    ROOM_TEMPLATES: {
        // Cave themed rooms - organic and irregular shapes
        cave: [
            {
                name: 'standard_cave',
                minWidth: 5,
                maxWidth: 12,
                minHeight: 5,
                maxHeight: 10,
                features: [
                    { type: 'WATER', chance: 0.2, count: { min: 1, max: 3 } },
                    { type: 'RUBBLE', chance: 0.4, count: { min: 2, max: 6 } }
                ],
                irregularity: 0.4 // High irregularity for natural cave feel
            },
            {
                name: 'large_cavern',
                minWidth: 8,
                maxWidth: 14,
                minHeight: 8,
                maxHeight: 12,
                features: [
                    { type: 'WATER', chance: 0.4, count: { min: 2, max: 5 } },
                    { type: 'RUBBLE', chance: 0.5, count: { min: 3, max: 8 } }
                ],
                irregularity: 0.5
            },
            {
                name: 'crystal_cave',
                minWidth: 6,
                maxWidth: 10,
                minHeight: 6,
                maxHeight: 10,
                features: [
                    { type: 'PILLAR', chance: 0.6, count: { min: 3, max: 8 } },
                    { type: 'RUBBLE', chance: 0.3, count: { min: 1, max: 4 } }
                ],
                irregularity: 0.3
            }
        ],

        // Crypt themed rooms - more regular, with pillars and altars
        crypt: [
            {
                name: 'burial_chamber',
                minWidth: 5,
                maxWidth: 10,
                minHeight: 5,
                maxHeight: 8,
                features: [
                    { type: 'PILLAR', chance: 0.7, count: { min: 2, max: 4 } },
                    { type: 'ALTAR', chance: 0.4, count: { min: 1, max: 1 } }
                ],
                irregularity: 0.1 // Very regular room shapes
            },
            {
                name: 'crypt_hall',
                minWidth: 4,
                maxWidth: 8,
                minHeight: 8,
                maxHeight: 14,
                features: [
                    { type: 'PILLAR', chance: 0.8, count: { min: 4, max: 8 } }
                ],
                irregularity: 0.1
            },
            {
                name: 'tomb_chamber',
                minWidth: 7,
                maxWidth: 11,
                minHeight: 7,
                maxHeight: 11,
                features: [
                    { type: 'ALTAR', chance: 0.8, count: { min: 1, max: 3 } },
                    { type: 'PILLAR', chance: 0.6, count: { min: 4, max: 8 } }
                ],
                irregularity: 0.1
            }
        ],

        // Ruins themed rooms - irregular with debris
        ruins: [
            {
                name: 'collapsed_chamber',
                minWidth: 6,
                maxWidth: 12,
                minHeight: 6,
                maxHeight: 10,
                features: [
                    { type: 'RUBBLE', chance: 0.8, count: { min: 4, max: 10 } },
                    { type: 'PILLAR', chance: 0.5, count: { min: 1, max: 3 } }
                ],
                irregularity: 0.3 // Somewhat irregular due to collapse
            },
            {
                name: 'ancient_hall',
                minWidth: 6,
                maxWidth: 12,
                minHeight: 8,
                maxHeight: 14,
                features: [
                    { type: 'PILLAR', chance: 0.7, count: { min: 4, max: 8 } },
                    { type: 'RUBBLE', chance: 0.5, count: { min: 2, max: 5 } }
                ],
                irregularity: 0.2
            },
            {
                name: 'crumbled_room',
                minWidth: 5,
                maxWidth: 9,
                minHeight: 5,
                maxHeight: 9,
                features: [
                    { type: 'RUBBLE', chance: 0.9, count: { min: 3, max: 7 } }
                ],
                irregularity: 0.4
            }
        ],

        // Classic dungeon themed rooms - regular with pillars
        dungeon: [
            {
                name: 'prison_cell',
                minWidth: 4,
                maxWidth: 6,
                minHeight: 4,
                maxHeight: 6,
                features: [
                    { type: 'RUBBLE', chance: 0.3, count: { min: 0, max: 2 } }
                ],
                irregularity: 0.1
            },
            {
                name: 'torture_chamber',
                minWidth: 6,
                maxWidth: 10,
                minHeight: 6,
                maxHeight: 10,
                features: [
                    { type: 'PILLAR', chance: 0.4, count: { min: 0, max: 4 } },
                    { type: 'ALTAR', chance: 0.5, count: { min: 1, max: 2 } }
                ],
                irregularity: 0.1
            },
            {
                name: 'guard_room',
                minWidth: 7,
                maxWidth: 11,
                minHeight: 7,
                maxHeight: 11,
                features: [
                    { type: 'PILLAR', chance: 0.3, count: { min: 0, max: 4 } }
                ],
                irregularity: 0.1
            }
        ],

        // Sewer themed rooms - water features
        sewer: [
            {
                name: 'flooded_chamber',
                minWidth: 6,
                maxWidth: 10,
                minHeight: 6,
                maxHeight: 10,
                features: [
                    { type: 'WATER', chance: 0.9, count: { min: 5, max: 15 } }
                ],
                irregularity: 0.2
            },
            {
                name: 'sewer_junction',
                minWidth: 8,
                maxWidth: 12,
                minHeight: 8,
                maxHeight: 12,
                features: [
                    { type: 'WATER', chance: 0.7, count: { min: 3, max: 8 } },
                    { type: 'RUBBLE', chance: 0.3, count: { min: 1, max: 3 } }
                ],
                irregularity: 0.3
            },
            {
                name: 'maintenance_room',
                minWidth: 5,
                maxWidth: 8,
                minHeight: 5,
                maxHeight: 8,
                features: [
                    { type: 'WATER', chance: 0.4, count: { min: 1, max: 3 } },
                    { type: 'PILLAR', chance: 0.5, count: { min: 2, max: 4 } }
                ],
                irregularity: 0.1
            }
        ]
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

        // Set theme based on level
        this.setThemeByLevel(level);

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

        console.log(`Dungeon level ${level} generated successfully with theme: ${this.theme}`);
    },

    /**
     * Set dungeon theme based on level
     * @param {number} level - Dungeon level
     */
    setThemeByLevel: function(level) {
        // Determine theme based on dungeon level
        if (level <= 3) {
            this.theme = this.THEMES.DUNGEON;
        } else if (level <= 6) {
            this.theme = this.THEMES.CAVE;
        } else if (level <= 9) {
            this.theme = this.THEMES.SEWER;
        } else if (level <= 12) {
            this.theme = this.THEMES.RUINS;
        } else {
            this.theme = this.THEMES.CRYPT;
        }

        console.log(`Set dungeon theme to ${this.theme} for level ${level}`);
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

        // Adjust recursion levels based on dungeon size to prevent overly small partitions
        const recursionLevels = Math.min(4, Math.floor(Math.log2(Math.min(this.width, this.height) / 10)));

        // Split the space recursively
        const partitions = this.splitPartition(rootPartition, recursionLevels);

        // Create rooms within the partitions
        partitions.forEach(partition => {
            try {
                // Ensure minimum dimensions for partitions to avoid invalid room calculations
                if (partition.width < 6 || partition.height < 6) {
                    return; // Skip this partition if it's too small
                }

                // Get room templates for current theme
                const templates = this.ROOM_TEMPLATES[this.theme];
                if (!templates || templates.length === 0) {
                    console.error(`No room templates found for theme: ${this.theme}`);
                    return;
                }

                // Select a random template for this room
                const template = templates[Utils.randomInt(0, templates.length - 1)];

                // Add some randomness to room size and position within partition
                const padding = 2;

                // Ensure roomWidth and roomHeight are within template specs and fit partition
                const minWidth = Math.max(template.minWidth, 3);
                const maxWidth = Math.min(template.maxWidth, partition.width - 2 * padding);
                const minHeight = Math.max(template.minHeight, 3);
                const maxHeight = Math.min(template.maxHeight, partition.height - 2 * padding);

                // Skip if we can't fit a proper room
                if (minWidth >= maxWidth || minHeight >= maxHeight) {
                    return;
                }

                // Generate room dimensions
                const roomWidth = Utils.randomInt(minWidth, maxWidth);
                const roomHeight = Utils.randomInt(minHeight, maxHeight);

                // Calculate maximum valid position values
                const maxRoomX = Math.max(0, partition.width - roomWidth - padding);
                const maxRoomY = Math.max(0, partition.height - roomHeight - padding);

                // Position the room with some randomness
                const roomX = partition.x + padding + Utils.randomInt(0, maxRoomX);
                const roomY = partition.y + padding + Utils.randomInt(0, maxRoomY);

                // Final bounds check to ensure room is within dungeon
                if (roomX < 0 || roomX + roomWidth >= this.width ||
                    roomY < 0 || roomY + roomHeight >= this.height) {
                    console.log(`Skipping room outside bounds: (${roomX},${roomY}) size ${roomWidth}x${roomHeight}`);
                    return; // Skip this room if it's outside the dungeon bounds
                }

                // Create the room
                const room = {
                    x: roomX,
                    y: roomY,
                    width: roomWidth,
                    height: roomHeight,
                    centerX: Math.floor(roomX + roomWidth / 2),
                    centerY: Math.floor(roomY + roomHeight / 2),
                    template: template.name,
                    theme: this.theme
                };

                this.rooms.push(room);

                // Carve the basic room into the grid
                this.carveRoom(room, template.irregularity);

                // Add template-specific features
                this.addRoomFeatures(room, template.features);

            } catch (error) {
                console.error('Error creating room in partition:', error, partition);
            }
        });

        console.log(`Generated ${this.rooms.length} rooms with ${this.theme} theme`);
    },

    /**
     * Carve a room into the dungeon grid
     * @param {Object} room - Room data
     * @param {number} irregularity - How irregular the room shape should be (0-1)
     */
    carveRoom: function(room, irregularity = 0) {
        // Create the basic room shape
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (Utils.isInBounds(x, y, this.width, this.height)) {
                    // Add irregularity to room edges
                    const isEdge = x === room.x || x === room.x + room.width - 1 ||
                                  y === room.y || y === room.y + room.height - 1;

                    if (isEdge && Math.random() < irregularity) {
                        // Leave this as a wall for irregular edges
                        continue;
                    }

                    // Ensure the grid row exists before setting a value
                    if (!this.grid[y]) {
                        this.grid[y] = [];
                    }
                    this.grid[y][x] = this.CELL_TYPES.FLOOR;
                }
            }
        }
    },

    /**
     * Add room features based on template
     * @param {Object} room - Room data
     * @param {Array} features - Features to potentially add
     */
    addRoomFeatures: function(room, features) {
        if (!features || features.length === 0) return;

        features.forEach(feature => {
            // Check if this feature should be added
            if (Math.random() > feature.chance) return;

            // Determine how many instances of this feature to add
            const count = Utils.randomInt(feature.count.min, feature.count.max);

            // Get the cell type for this feature
            const cellType = this.CELL_TYPES[feature.type];
            if (cellType === undefined) {
                console.error(`Unknown feature type: ${feature.type}`);
                return;
            }

            // Add the feature instances
            for (let i = 0; i < count; i++) {
                // Find a valid position (not on edges)
                let attempts = 0;
                let placed = false;

                while (!placed && attempts < 10) {
                    attempts++;

                    // Place away from edges
                    const x = Utils.randomInt(room.x + 1, room.x + room.width - 2);
                    const y = Utils.randomInt(room.y + 1, room.y + room.height - 2);

                    // Check if this position is already a floor
                    if (this.getCellType(x, y) === this.CELL_TYPES.FLOOR) {
                        // Place the feature
                        this.grid[y][x] = cellType;
                        placed = true;
                    }
                }
            }
        });
    },

    /**
     * Recursively split a partition into smaller partitions
     * @param {Object} partition - The partition to split
     * @param {number} depth - Current recursion depth
     * @returns {Array} Array of partitions
     */
    splitPartition: function(partition, depth) {
        // Base case: stop recursion when we reach max depth or partition is too small
        if (depth === 0 || partition.width < 15 || partition.height < 15) {
            return [partition];
        }

        const partitions = [];

        // Decide whether to split horizontally or vertically based on partition shape
        // Favor splitting along the longer dimension
        const splitHorizontally = partition.height > partition.width ||
                                 (partition.height === partition.width && Math.random() < 0.5);

        if (splitHorizontally) {
            // Split horizontally - ensure we maintain minimum useful height (7 minimum)
            const minSplitPosition = partition.y + Math.max(7, Math.floor(partition.height * 0.3));
            const maxSplitPosition = partition.y + Math.min(partition.height - 7, Math.floor(partition.height * 0.7));

            // Guard against invalid split positions
            if (maxSplitPosition <= minSplitPosition) {
                return [partition]; // Cannot split further, return as is
            }

            const splitY = Utils.randomInt(minSplitPosition, maxSplitPosition);

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
                height: partition.y + partition.height - splitY
            };

            // Recursively split these partitions
            partitions.push(...this.splitPartition(topPartition, depth - 1));
            partitions.push(...this.splitPartition(bottomPartition, depth - 1));
        } else {
            // Split vertically - ensure we maintain minimum useful width (7 minimum)
            const minSplitPosition = partition.x + Math.max(7, Math.floor(partition.width * 0.3));
            const maxSplitPosition = partition.x + Math.min(partition.width - 7, Math.floor(partition.width * 0.7));

            // Guard against invalid split positions
            if (maxSplitPosition <= minSplitPosition) {
                return [partition]; // Cannot split further, return as is
            }

            const splitX = Utils.randomInt(minSplitPosition, maxSplitPosition);

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
                width: partition.x + partition.width - splitX,
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
            theme: this.theme,
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
        this.theme = data.theme || 'cave'; // Default to cave if no theme in saved data
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
