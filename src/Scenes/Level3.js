class Level3 extends Phaser.Scene {
    constructor() {
        super("level3Scene");
    }

    init() {
        
        this.ACCELERATION = 400;
        this.DRAG = 1000;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;

        this.numCoinsCollected = 0;
        this.totalCoins = 46;  
        this.gameWon = false;
        this.gameOver = false; 
        this.hasKey = false; 
        this.invincible = false; 
    }

    create() {
        
        this.map = this.add.tilemap("level_3_design", 18, 18, 45, 25);
        this.backgroundTileset = this.map.addTilesetImage("Background", "backtilemap_tiles");
        this.tileset = [this.map.addTilesetImage("Kenny_Assets", "tilemap_tiles")];

        
        this.backgroundLayer = this.map.createLayer("Background", this.backgroundTileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({ collides: true });

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.flag = this.map.createFromObjects("Objects", {
            name: "3flag",
            key: "tilemap_sheet",
            frame: 131
        });

        this.drown = this.map.createFromObjects("Objects", {
            name: "drown",
            key: "tilemap_sheet",
            frame: 73 
        });

        this.keys = this.map.createFromObjects("Objects", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27 
        });

        this.locks = this.map.createFromObjects("Objects", {
            name: "lock",
            key: "tilemap_sheet",
            frame: 28 
        });

        this.spikes = this.map.createFromObjects("Objects", {
            name: "spike",
            key: "tilemap_sheet",
            frame: 68 
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.drown, Phaser.Physics.Arcade.STATIC_BODY); 
        this.physics.world.enable(this.keys, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.locks, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY); 

        this.coinGroup = this.add.group(this.coins);
        this.flagGroup = this.add.group(this.flag);
        this.drownGroup = this.add.group(this.drown); 
        this.keyGroup = this.add.group(this.keys);
        this.lockGroup = this.add.group(this.locks);
        this.spikeGroup = this.add.group(this.spikes); 

        my.sprite.player = this.physics.add.sprite(50, 100, "platformer_characters", "tile_0002.png");
        my.sprite.player.setCollideWorldBounds(true);
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy();
            this.numCoinsCollected++;
            this.sound.play('coinSound');
        });

        this.physics.add.overlap(my.sprite.player, this.flagGroup, (player, flag) => {
            if (this.numCoinsCollected === this.totalCoins) {
                this.winGame();
            }
        });

        this.physics.add.overlap(my.sprite.player, this.drownGroup, (player, drown) => {
            this.drownPlayer();
        });

        this.physics.add.overlap(my.sprite.player, this.keyGroup, (player, key) => {
            this.pickUpKey(key);
        });

        this.physics.add.collider(my.sprite.player, this.lockGroup, (player, lock) => {
            if (this.hasKey) {
                this.unlockLock(lock);
            }
        });

        this.physics.add.overlap(my.sprite.player, this.spikeGroup, (player, spike) => {
            this.hitSpike();
        });

        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: { start: 0.02, end: 0.009 },
            lifespan: 350,
            alpha: { start: 1, end: 0.1 },
        });

        my.vfx.walking.stop();

        this.cameras.main.setBounds(0, -75, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.coinCounter = this.add.text(550, 240, 'Coins: 0/46', {
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

        this.drownMessage = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, '', {
            fontFamily: 'Arial',
            fontSize: 32,
            color: 'Red',
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
        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.backgroundMusic.stop();
                this.scene.restart();
            }
            return;
        }

        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
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
            this.scene.start('platformerScene');
        }

        this.coinCounter.setText('Coins: ' + this.numCoinsCollected + '/43');

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
        this.winMessage.setText('Congrats! You Won!\nPress R to Restart Level\nPress N to Restart Game');
        this.backgroundMusic.stop();
        this.sound.play('winSound');
    }

    drownPlayer() {
        this.gameOver = true;
        this.drownMessage.setText('You Died! Press R to restart');
        this.backgroundMusic.stop();
        my.sprite.player.setTint(0xff0000);
        my.sprite.player.anims.stop();
        my.sprite.player.setAccelerationX(0);
        my.sprite.player.setDragX(this.DRAG);
    }

    pickUpKey(key) {
        this.hasKey = true;
        key.destroy();
        this.sound.play('keySound'); 
    }

    unlockLock(lock) {
        lock.destroy();
        this.sound.play('unlockSound'); 
    }

    hitSpike() {
        if (!this.invincible) {
            this.playerHealth -= 1;
            this.updateHearts();
            this.sound.play('hurtSound'); 
            if (this.playerHealth <= 0) {
                this.drownPlayer();
            } else {
                this.invincible = true;
                my.sprite.player.setTint(0xff0000);
                this.time.delayedCall(3000, () => {
                    this.invincible = false;
                    my.sprite.player.clearTint();
                });
            }
        }
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
