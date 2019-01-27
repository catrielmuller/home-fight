import Player from '../sprites/Player';
import PowerUp from '../sprites/PowerUp';
import SMBTileSprite from '../sprites/SMBTileSprite';
import AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.min.js';
import Fire from '../sprites/Fire';

import socket from '../helpers/socket';

import EnemyPlayer from '../sprites/EnemyPlayer';
import Spawnlocations from '../helpers/spawnlocations';

class GameScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'GameScene'
    });
    this.playerName;
    this.createEnemyPlayer = this.createEnemyPlayer.bind(this);
  }

  preload() {
    this.load.scenePlugin(
      'animatedTiles',
      AnimatedTiles,
      'animatedTiles',
      'animatedTiles'
    );
  }

  create() {
    this.homeFightUser = localStorage.getItem('home-fight-user');
    this.eightBit = true;
    // Add and play the music
    this.music = this.sound.add('overworld');
    this.music.play({
      loop: true
    });

    // Add the map + bind the tileset
    this.map = this.make.tilemap({
      key: 'map'
    });
    this.tileset = this.map.addTilesetImage('SuperMarioBros-World1-1', 'tiles');

    // Dynamic layer because we want breakable and animated tiles
    this.groundLayer = this.map.createDynamicLayer('world', this.tileset, 0, 0);

    // We got the map. Tell animated tiles plugin to loop through the tileset properties and get ready.
    // We don't need to do anything beyond this point for animated tiles to work.
    this.sys.animatedTiles.init(this.map);

    // Probably not the correct way of doing this:
    this.physics.world.bounds.width = this.groundLayer.width;

    // Add the background as an tilesprite.
    this.add.tileSprite(0, 0, this.groundLayer.width, 500, 'background-clouds');

    // Set collision by property
    this.groundLayer.setCollisionByProperty({
      collide: true
    });

    // This group contains all enemies for collision and calling update-methods
    this.enemyGroup = this.add.group();

    this.enemyPlayerGroup = this.add.group();

    // A group powerUps to update
    this.powerUps = this.add.group();

    // Populate enemyGroup, powerUps, pipes and destinations from object layers
    this.parseObjectLayers();

    // this.keys will contain all we need to control Mario.
    // Any key could just replace the default (like this.key.jump)
    this.keys = {
      jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      jump2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      fire: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
    };

    // An emitter for bricks when blcreateEnemyPlayerocks are destroyed.
    this.blockEmitter = this.add.particles('mario-sprites');

    this.blockEmitter.createEmitter({
      frame: {
        frames: ['brick'],
        cycle: true
      },
      gravityY: 1000,
      lifespan: 2000,
      speed: 400,
      angle: {
        min: -90 - 25,
        max: -45 - 25
      },
      frequency: -1
    });

    // Used when hitting a tile from below that should bounce up.
    this.bounceTile = new SMBTileSprite({
      scene: this
    });

    this.createHUD();

    // Prepare the finishLine
    let worldEndAt = -1;
    for (let x = 0; x < this.groundLayer.width; x++) {
      let tile = this.groundLayer.getTileAt(x, 2);
      if (tile && tile.properties.worldsEnd) {
        worldEndAt = tile.pixelX;
        break;
      }
    }
    this.finishLine = {
      x: worldEndAt,
      flag: this.add.sprite(worldEndAt + 8, 4 * 16),
      active: false
    };
    this.finishLine.flag.play('flag');
    // Mute music
    this.music.volume = 0;

    // If the game ended while physics was disabled
    this.physics.world.resume();

    // CREATE PLAYER!!!
    var spawnLocation = Spawnlocations.getRandomSpawnLocation();
    console.log('Spawning player on location ', spawnLocation);

    this.player = new Player({
      bullets: 7,
      scene: this,
      key: 'player',
      x: spawnLocation.x,
      y: spawnLocation.y
    });

    //adds player name
    this.playerName = this.add.bitmapText(
      this.player.x,
      this.player.y,
      'font',
      this.homeFightUser,
      8
    );

    // Get players
    this.players = {};
    this.fireballs = {};
    socket.on('currentPlayers', players => {
      console.log('Yay! Players obtenidos', players);
      Object.values(players).forEach(this.createEnemyPlayer);
      socket.off('currentPlayers');
    });
    socket.on('deletePlayer', id => {
      console.log('Player disconected', id);
      if (this.players[id]) {
        this.players[id].playerName.destroy();
        this.players[id].destroy();
        delete this.players[id];
      }
    });
    socket.on('newPlayer', this.createEnemyPlayer);
    socket.on('playerMove', player => {
      const { id, x, y, r } = player;
      if (this.players[id]) {
        this.players[id].move(player);
        this.players[id].playerName.x =
          this.players[id].x +
          this.players[id].width / 2 -
          this.players[id].playerName.width / 2;
        this.players[id].playerName.y =
          this.players[id].y - this.players[id].height;
      }
    });

    socket.on('playerBullet', player => {
      const { id, bullets } = player;
      if (socket.id === id) {
        this.player.bullets = bullets;
        console.log('bullets', this.player.bullets);
        if (this.player.bullets < 0) {
          this.player.die();
        }
      } else {
        this.players[id].bullets = bullets;
      }
    });

    socket.emit('initPlayer', {
      username: this.homeFightUser,
      bullets: this.player.bullets
    });

    // The camera should follow Mario
    this.cameras.main.startFollow(this.player);

    this.cameras.main.roundPixels = true;

    socket.on('broadcastProjectile', projectileRecieved => {
      let fireball = this.fireballs.get(this);
      if (fireball) {
        this.fireballs[projectileRecieved.id] = fireball;
        this.fireballs[projectileRecieved.id].id = projectileRecieved.id;
        fireball.draw(projectileRecieved);
      } else {
        console.error('FAILED TO GET FIREBALL');
      }
    });

    socket.on('fireballExploded', ({ id, x, y }) => {
      if (this.fireballs[id]) {
        this.fireballs[id].body.reset(x, y);
        this.fireballs[id].explode(false);
      }
    });
    socket.on('fireballPickedUp', ({ id, player, x, y }) => {
      if (this.fireballs[id]) {
        this.fireballs[id].body.reset(x, y);
        this.fireballs[id].pickup(player, false);
      }
    });

    socket.on('hitConfirmed', hitInfo => {
      var timeOnScreen = 10000;
      var eventText = hitInfo.sourceName + ' pwneo a ' + hitInfo.targetName;
      console.log(eventText, this.cameras);
      var style = {
        font: '16px Arial',
        fill: '#ff0044',
        align: 'right',
        backgroundColor: '#ffcc99'
      };

      var text = this.add
        .text(
          eventText.length * 15,
          20 * this.tweens.getAllTweens().length,
          eventText,
          style
        )
        .setScrollFactor(0, 0);

      text.alpha = 1;
      this.tweens.add(
        { targets: text, alpha: 0 },
        timeOnScreen,
        'Linear',
        true
      );
    });

    socket.on('updateScore', updatedScore => {
      //TODO: Actualizar puntaje
      console.log(updatedScore);
    });
    //Object.values(players).forEach(this.createEnemyPlayer);
    //socket.off('currentPlayers');

    socket.on('playerDeathConfirmed', playerInfo => {
      if (this.players[playerInfo.id]) {
        this.players[playerInfo.id].die();
        this.players[playerInfo.id].playerName.destroy();
      }

      console.log(playerInfo + ' was eliminated');
    });

    this.fireballs = this.add.group({
      classType: Fire,
      maxSize: 1000,
      runChildUpdate: false // Due to https://github.com/photonstorm/phaser/issues/3724
    });
  }

  createEnemyPlayer(player) {
    const { x, y, r, id, username, bullets } = player;
    this.players[id] = new EnemyPlayer({
      bullets,
      id,
      scene: this,
      key: 'mario',
      x,
      y,
      r
    });

    //adds other players names
    this.players[id].playerName = this.add.bitmapText(
      x,
      y,
      'font',
      username,
      8
    );
    this.enemyPlayerGroup.add(this.players[id]);
  }

  update(time, delta) {
    if (!this.attractMode) {
      // this.record(delta);
    }

    // this.fireballs.children.forEach((fire)=>{
    //    fire.update(time, delta);
    // })

    Array.from(this.fireballs.children.entries).forEach(fireball => {
      fireball.update(time, delta);
    });

    /* console.log(time); */
    if (this.physics.world.isPaused) {
      return;
    }

    // Run the update method of player
    this.player.update(this.keys, time, delta);

    this.playerName.x =
      this.player.x + this.player.width / 2 - this.playerName.width / 2;
    this.playerName.y = this.player.y - this.player.height;

    // Run the update method of all enemies
    this.enemyGroup.children.entries.forEach(sprite => {
      sprite.update(time, delta);
    });

    this.enemyPlayerGroup.children.entries.forEach(sprite => {
      sprite.update(time, delta);
    });

    // Run the update method of non-enemy sprites
    this.powerUps.children.entries.forEach(sprite => {
      sprite.update(time, delta);
    });

    this.bullets.textObject.setText(
      ('' + this.player.bullets).padStart(6, '0')
    );
  }

  tileCollision(sprite, tile) {
    // If it's Mario and the body isn't blocked up it can't hit question marks or break bricks
    // Otherwise Mario will break bricks he touch from the side while moving up.
    if (sprite.type === 'player' && !sprite.body.blocked.up) {
      return;
    }

    // If the tile has a callback, lets fire it
    if (tile.properties.callback) {
      switch (tile.properties.callback) {
      case 'questionMark':
        // Shift to a metallic block
        tile.index = 44;

        // Bounce it a bit
        sprite.scene.bounceTile.restart(tile);

        // The questionmark is no more
        tile.properties.callback = null;

        // Invincible blocks are only collidable from above, but everywhere once revealed
        tile.setCollision(true);

        // Check powerUp for what to do, make a coin if not defined
        let powerUp = tile.powerUp ? tile.powerUp : 'coin';

        // Make powerUp (including a coin)
        (() =>
          new PowerUp({
            scene: sprite.scene,
            key: 'sprites16',
            x: tile.x * 16 + 8,
            y: tile.y * 16 - 8,
            type: powerUp
          }))();

        break;
      case 'breakable':
        if (sprite.type === 'player' && sprite.animSuffix === '') {
          // Can't break it anyway. Bounce it a bit.
          sprite.scene.bounceTile.restart(tile);
          sprite.scene.sound.playAudioSprite('sfx', 'smb_bump');
        } else {
          // get points
          sprite.scene.updateScore(50);
          sprite.scene.map.removeTileAt(
            tile.x,
            tile.y,
            true,
            true,
            this.groundLayer
          );
          sprite.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
          sprite.scene.blockEmitter.emitParticle(6, tile.x * 16, tile.y * 16);
        }
        break;
      case 'toggle16bit':
        sprite.scene.eightBit = !sprite.scene.eightBit;
        if (sprite.scene.eightBit) {
          sprite.scene.tileset.setImage(
            sprite.scene.sys.textures.get('tiles')
          );
        } else {
          sprite.scene.tileset.setImage(
            sprite.scene.sys.textures.get('tiles-16bit')
          );
        }
        break;
      default:
        sprite.scene.sound.playAudioSprite('sfx', 'smb_bump');
        break;
      }
    } else {
      sprite.scene.sound.playAudioSprite('sfx', 'smb_bump');
    }
  }

  /* * To be removed, supported natively now:
     * setCollisionByProperty(map) {
      Object.keys(map.tilesets[0].tileProperties).forEach(
        (id) => {

          if (map.tilesets[0].tileProperties[id].collide) {
            map.setCollision(parseInt(id) + 1);
          }
        }
      )
    } */

  updateScore(score) {
    // Remove
  }

  updateBullets() {
    this.bullets.value = this.player.bullets;
    this.bullets.textObject.setText(('' + this.bullets.value).padStart(6, '0'));
  }

  parseObjectLayers() {
    return;

    // The map has an object layer with 'modifiers' that do 'stuff', see below
    this.map.getObjectLayer('modifiers').objects.forEach(modifier => {
      let tile, properties, type;

      // Get property stuff from the tile if present or just from the object layer directly
      if (typeof modifier.gid !== 'undefined') {
        properties = this.tileset.tileProperties[modifier.gid - 1];
        type = properties.type;
        if (properties.hasOwnProperty('powerUp')) {
          type = 'powerUp';
        }
      } else {
        type = modifier.properties.type;
      }

      switch (type) {
      case 'powerUp':
        // Modifies a questionmark below the modifier to contain something else than the default (coin)
        tile = this.groundLayer.getTileAt(
          modifier.x / 16,
          modifier.y / 16 - 1
        );
        tile.powerUp = properties.powerUp;
        tile.properties.callback = 'questionMark';
        if (!tile.collides) {
          // Hidden block without a question mark
          tile.setCollision(false, false, false, true);
        }
        break;
      case 'pipe':
        // Adds info on where to go from a pipe under the modifier
        tile = this.groundLayer.getTileAt(modifier.x / 16, modifier.y / 16);
        tile.properties.dest = parseInt(modifier.properties.goto);
        break;
      case 'dest':
        // Adds a destination so that a pipe can find it
        this.destinations[modifier.properties.id] = {
          x: modifier.x + modifier.width / 2,
          top: modifier.y < 16
        };
        break;
      case 'room':
        // Adds a 'room' that is just info on bounds so that we can add sections below pipes
        // in an level just using one tilemap.
        this.rooms.push({
          x: modifier.x,
          width: modifier.width,
          sky: modifier.properties.sky
        });
        break;
      }
    });
  }

  createHUD() {
    const hud = this.add.bitmapText(5 * 8, 8, 'font', 'CANDY', 24);
    hud.setScrollFactor(0, 0);
    this.bullets = {
      textObject: this.add.bitmapText(5 * 8, 8 + 30, 'font', '000000', 24)
    };
    this.bullets.textObject.setScrollFactor(0, 0);
  }

  cleanUp() {
    // Never called since 3.10 update (I called it from create before). If Everything is fine, I'll remove this method.
    // Scenes isn't properly destroyed yet.
    let ignore = [
      'sys',
      'anims',
      'cache',
      'registry',
      'sound',
      'textures',
      'events',
      'cameras',
      'make',
      'add',
      'scene',
      'children',
      'cameras3d',
      'time',
      'data',
      'input',
      'load',
      'tweens',
      'lights',
      'physics'
    ];
    let whatThisHad = [
      'sys',
      'anims',
      'cache',
      'registry',
      'sound',
      'textures',
      'events',
      'cameras',
      'make',
      'add',
      'scene',
      'children',
      'cameras3d',
      'time',
      'data',
      'input',
      'load',
      'tweens',
      'lights',
      'physics',
      'attractMode',
      'destinations',
      'rooms',
      'eightBit',
      'music',
      'map',
      'tileset',
      'groundLayer',
      'player',
      'enemyGroup',
      'powerUps',
      'keys',
      'blockEmitter',
      'bounceTile',
      'score',
      'finishLine',
      'touchControls'
    ];
    whatThisHad.forEach(key => {
      if (ignore.indexOf(key) === -1 && this[key]) {
        switch (key) {
        case 'enemyGroup':
        case 'music':
        case 'map':
          this[key].destroy();
          break;
        }
        this[key] = null;
      }
    });
  }
}

export default GameScene;
