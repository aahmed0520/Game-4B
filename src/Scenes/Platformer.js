class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 1000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;

        this.numCoinsCollected = 0;
        this.totalCoins = 34;  // total number of coins to collect
        this.gameWon = false;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer_design", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.backgroundTileset = this.map.addTilesetImage("Background", "backtilemap_tiles");
        this.tileset = [this.map.addTilesetImage("Kenny_Assets", "tilemap_tiles")];

        // Create a layer
        //this.backLayer = this.map.createLayer("Background", this.tileset2, 0, 0);
        this.backgroundLayer = this.map.createLayer("Background", this.backgroundTileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.flag = this.map.createFromObjects("Objects", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 131
        });
        this.flag2 = this.map.createFromObjects("Objects", {
            name: "flag2",
            key: "tilemap_sheet",
            frame: 111
        });

        

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.flagGroup = this.add.group(this.flag);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(50, 100, "platformer_characters", "tile_0002.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.numCoinsCollected++;
            this.sound.play('coinSound');
        });

        this.physics.add.overlap(my.sprite.player, this.flagGroup, (player, flag) => {
            if (this.numCoinsCollected === this.totalCoins) {
                this.winGame();
            }
        });
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

       

        // TODO: Add movement vfx here
        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.02, end: 0.009},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, -75, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.coinCounter = this.add.text(550, 240, 'Coins: 0/34', {
            fontFamily: 'Arial',
            fontSize: 25,
            color: 'white'
        }).setScrollFactor(0);

        this.winMessage = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, '', {
            fontFamily: 'Arial',
            fontSize: 32,
            color: 'Blue',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);

        this.backgroundMusic = this.sound.add('backSound', { loop: true });
        this.backgroundMusic.play();

        this.playerHealth = 3;

        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            this.hearts.push(this.add.image(1525 + i * 30, 250, 'heart').setScrollFactor(0).setScale(0.11));
        }

        
    }

    update() {
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
    
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2 - 10, my.sprite.player.displayHeight/2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
    
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
    
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2 - 10, my.sprite.player.displayHeight/2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
    
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }
    
        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play('jumpSound');
        }
    
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.backgroundMusic.stop();
            this.scene.restart();
        }
    
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('N')) && this.gameWon) {
            this.scene.start('level2Scene');
        }
    
        this.coinCounter.setText('Coins: ' + this.numCoinsCollected + '/34');

        for (let i = 0; i < 3; i++) {
            if (i < this.playerHealth) {
                this.hearts[i].setVisible(true);
            } else {
                this.hearts[i].setVisible(false);
            }
        }
    }
    winGame() {
        this.gameWon = true;
        this.winMessage.setText('Congrats! You Won!\nPress R to Restart\nPress N to Next Level');
        this.backgroundMusic.stop();
        this.sound.play('winSound');
    }
    updateHearts() {
        for (let i = 0; i < 3; i++) {
            if (i < this.playerHealth) {
                this.hearts[i].setVisible(true);
            } else {
                this.hearts[i].setVisible(false);
            }
        }
    }
}