import { Scene } from 'phaser';

interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX?: number;
    centerY?: number;
}

interface DungeonTile {
    x: number;
    y: number;
    isWall: boolean;
}

export class Game extends Scene
{
    private player: Phaser.GameObjects.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private walls: Phaser.Physics.Arcade.StaticGroup;
    private rooms: Room[] = [];
    private dungeon: Map<string, DungeonTile> = new Map();
    private tileSize = 50;
    private mapWidth = 100;
    private mapHeight = 100;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.spritesheet('player', 'assets/Soldier.png', {
            frameWidth: 100,
            frameHeight: 100
        });
    }

    private generateDungeon ()
    {
        // Initialize dungeon as all walls
        for (let y = 0; y < this.mapHeight; y++)
        {
            for (let x = 0; x < this.mapWidth; x++)
            {
                this.dungeon.set(`${x},${y}`, { x, y, isWall: true });
            }
        }

        // Create rooms using recursive division
        this.createRooms(1, 1, this.mapWidth - 2, this.mapHeight - 2, true);

        // Connect rooms with corridors
        this.connectRooms();

        // Draw the dungeon
        this.drawDungeon();
    }

    private createRooms(x: number, y: number, width: number, height: number, horizontal: boolean)
    {
        if (width < 8 || height < 8)
        {
            return;
        }

        if (horizontal)
        {
            const divide = Phaser.Math.Between(3, height - 4);
            this.carveRoom(x, y, width, divide);
            this.carveHorizontalCorridor(x, y + divide, width);
            this.createRooms(x, y, width, divide, false);
            this.createRooms(x, y + divide + 1, width, height - divide - 1, false);
        }
        else
        {
            const divide = Phaser.Math.Between(3, width - 4);
            this.carveRoom(x, y, divide, height);
            this.carveVerticalCorridor(x + divide, y, height);
            this.createRooms(x, y, divide, height, true);
            this.createRooms(x + divide + 1, y, width - divide - 1, height, true);
        }
    }

    private carveRoom(x: number, y: number, width: number, height: number)
    {
        const roomX = x + Phaser.Math.Between(0, Math.max(1, width - 5));
        const roomY = y + Phaser.Math.Between(0, Math.max(1, height - 5));
        const roomWidth = Phaser.Math.Between(3, Math.min(width - 1, 8));
        const roomHeight = Phaser.Math.Between(3, Math.min(height - 1, 8));

        for (let py = roomY; py < roomY + roomHeight && py < this.mapHeight; py++)
        {
            for (let px = roomX; px < roomX + roomWidth && px < this.mapWidth; px++)
            {
                const tile = this.dungeon.get(`${px},${py}`);
                if (tile)
                {
                    tile.isWall = false;
                }
                this.rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });
            }
        }
    }

    private carveHorizontalCorridor(x: number, y: number, width: number)
    {
        for (let px = x; px < x + width && px < this.mapWidth; px++)
        {
            const tile = this.dungeon.get(`${px},${y}`);
            if (tile)
            {
                tile.isWall = false;
            }
        }
    }

    private carveVerticalCorridor(x: number, y: number, height: number)
    {
        for (let py = y; py < y + height && py < this.mapHeight; py++)
        {
            const tile = this.dungeon.get(`${x},${py}`);
            if (tile)
            {
                tile.isWall = false;
            }
        }
    }

    private connectRooms()
    {
        if (this.rooms.length < 2) return;

        // Remove duplicate rooms
        const uniqueRooms = this.rooms.filter((room, index, self) =>
            index === self.findIndex(r => r.x === room.x && r.y === room.y && r.width === room.width && r.height === room.height)
        );

        this.rooms = uniqueRooms;

        // Connect adjacent rooms
        for (let i = 0; i < this.rooms.length - 1; i++)
        {
            const room1 = this.rooms[i];
            const room2 = this.rooms[i + 1];

            room1.centerX = room1.x + Math.floor(room1.width / 2);
            room1.centerY = room1.y + Math.floor(room1.height / 2);
            room2.centerX = room2.x + Math.floor(room2.width / 2);
            room2.centerY = room2.y + Math.floor(room2.height / 2);

            // Create L-shaped corridor
            const x = room1.centerX!;
            const y = room1.centerY!;

            // Horizontal corridor
            const startX = Math.min(x, room2.centerX!);
            const endX = Math.max(x, room2.centerX!);
            for (let px = startX; px <= endX && px < this.mapWidth; px++)
            {
                const tile = this.dungeon.get(`${px},${y}`);
                if (tile) tile.isWall = false;
            }

            // Vertical corridor
            const startY = Math.min(y, room2.centerY!);
            const endY = Math.max(y, room2.centerY!);
            for (let py = startY; py <= endY && py < this.mapHeight; py++)
            {
                const tile = this.dungeon.get(`${x},${py}`);
                if (tile) tile.isWall = false;
            }
        }
    }

    private drawDungeon()
    {
        this.walls = this.physics.add.staticGroup();

        this.dungeon.forEach(tile => {
            const screenX = tile.x * this.tileSize;
            const screenY = tile.y * this.tileSize;

            if (tile.isWall)
            {
                const wall = this.add.rectangle(screenX + this.tileSize / 2, screenY + this.tileSize / 2, this.tileSize, this.tileSize, 0x1a1a1a);
                this.physics.add.existing(wall, true);
                
                // Fix collision body to match visual size exactly
                const wallBody = wall.body as Phaser.Physics.Arcade.StaticBody;
                wallBody.setSize(this.tileSize, this.tileSize);
                wallBody.updateFromGameObject();
                
                this.walls.add(wall);
            }
            else
            {
                this.add.rectangle(screenX + this.tileSize / 2, screenY + this.tileSize / 2, this.tileSize, this.tileSize, 0x2d5016);
            }
        });
    }

    create ()
    {
        console.log('Generating dungeon...');
        
        // Enable physics
        this.physics.world.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);

        // Generate procedural dungeon
        this.generateDungeon();

        // Create player sprite with physics
        const playerStartX = this.rooms[0].x * this.tileSize + this.rooms[0].width * this.tileSize / 2;
        const playerStartY = this.rooms[0].y * this.tileSize + this.rooms[0].height * this.tileSize / 2;

        this.player = this.add.sprite(playerStartX, playerStartY, 'player', 0);
        this.player.setScale(0.5);
        this.physics.add.existing(this.player);
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        
        // Set player body size to be smaller for better collision
        playerBody.setSize(40, 40);
        playerBody.setOffset(30, 30);
        playerBody.setCollideWorldBounds(true);
        playerBody.setBounce(0, 0);

        // Create animations based on sprite sheet layout
        // Row 0: Idle (6 frames)
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });

        // Row 1: Walk (8 frames)
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 6, end: 13 }),
            frameRate: 10,
            repeat: -1
        });

        // Row 2: Attack (6 frames)
        this.anims.create({
            key: 'attack',
            frames: this.anims.generateFrameNumbers('player', { start: 14, end: 19 }),
            frameRate: 12,
            repeat: 0
        });

        // Row 5: Hurt (4 frames)
        this.anims.create({
            key: 'hurt',
            frames: this.anims.generateFrameNumbers('player', { start: 41, end: 44 }),
            frameRate: 10,
            repeat: 0
        });

        // Row 7: Death (6 frames)
        this.anims.create({
            key: 'death',
            frames: this.anims.generateFrameNumbers('player', { start: 54, end: 59 }),
            frameRate: 8,
            repeat: 0
        });

        // Start with idle animation
        this.player.play('idle');

        // Add collision between player and walls
        this.physics.add.collider(this.player, this.walls);

        // Keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Add camera to follow player
        this.cameras.main.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(3.5);

        // UI text
        this.add.text(20, 20, 'Procedural Dungeon | Arrow Keys to Move', {
            fontSize: '24px',   
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0);

        console.log('Dungeon created with ' + this.rooms.length + ' rooms');
    }

    update ()
    {
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const speed = 150;

        // Reset velocity
        playerBody.setVelocity(0, 0);

        let isMoving = false;

        // Move player with arrow keys
        if (this.cursors.left.isDown)
        {
            playerBody.setVelocityX(-speed);
            this.player.setFlipX(true);
            isMoving = true;
        }
        else if (this.cursors.right.isDown)
        {
            playerBody.setVelocityX(speed);
            this.player.setFlipX(false);
            isMoving = true;
        }

        if (this.cursors.up.isDown)
        {
            playerBody.setVelocityY(-speed);
            isMoving = true;
        }
        else if (this.cursors.down.isDown)
        {
            playerBody.setVelocityY(speed);
            isMoving = true;
        }

        // Play appropriate animation
        if (isMoving)
        {
            if (this.player.anims.currentAnim?.key !== 'walk')
            {
                this.player.play('walk', true);
            }
        }
        else
        {
            if (this.player.anims.currentAnim?.key !== 'idle')
            {
                this.player.play('idle', true);
            }
        }
    }
}
