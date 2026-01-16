import { Scene } from 'phaser';

export class Game extends Scene
{
    private player: Phaser.GameObjects.Rectangle;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        console.log('Game scene created!');
        
        // Create green ground/background
        this.add.rectangle(400, 300, 800, 600, 0x00ff00);

        // Create black player character
        this.player = this.add.rectangle(400, 300, 30, 30, 0x000000);

        // Setup keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Add simple text
        this.add.text(400, 20, 'Use Arrow Keys to Move', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
    }

    update ()
    {
        const speed = 3;

        // Move player with arrow keys
        if (this.cursors.left.isDown)
        {
            this.player.x -= speed;
        }
        else if (this.cursors.right.isDown)
        {
            this.player.x += speed;
        }

        if (this.cursors.up.isDown)
        {
            this.player.y -= speed;
        }
        else if (this.cursors.down.isDown)
        {
            this.player.y += speed;
        }

        // Keep player within bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 15, 785);
        this.player.y = Phaser.Math.Clamp(this.player.y, 15, 585);
    }
}
