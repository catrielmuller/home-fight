import socket from '../helpers/socket';

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, config.x, config.y, config.key);
    config.scene.physics.world.enable(this);
    config.scene.add.existing(this);

    config.scene.physics.add.collider(
      config.scene.groundLayer,
      this,
      this.collideWithMap.bind(this)
    );

    this.acceleration = 2400;
    this.body.maxVelocity.x = 800;
    this.body.maxVelocity.y = 2000;
    this.animSuffix = '';
    this.bullets = config.bullets;
    this.respawnCount = 5;
    // this.small();

    // this.animSuffix = 'Super';
    this.large();

    this.wasHurt = -1;
    this.flashToggle = false;
    this.star = {
      active: false,
      timer: -1,
      step: 0
    };
    this.enteringPipe = false;
    this.anims.play('player-pv-idle');
    this.alive = true;
    this.type = 'player';
    this.jumpTimer = 0;
    this.jumping = false;
    this.fireCoolDown = 0;
    this.isHurt = false;

    this.on(
      'animationcomplete',
      () => {
        if (
          this.anims.currentAnim.key === 'grow' ||
          this.anims.currentAnim.key === 'shrink'
        ) {
          this.scene.physics.world.resume();
        }
      },
      this
    );

    this.animSuffix = 'Fire';
    this.scene.updateScore(this.bullets);
    //this.scene.sound.playAudioSprite('sfx', 'smb_powerup');
  }

  update(keys, time, delta) {
    if (this.y > 2040) {
      // Really superdead, has been falling for a while.
      this.scene.scene.start('GameScene');

      // If Mario falls down a cliff or died, just let him drop from the sky and prentend like nothing happened
      // this.y = -32;
      // if(this.x<16){
      //   this.x = 16;
      // }
      // this.alive = true;
      // this.scene.music.seek = 0;
      // this.scene.music.play();
    }

    // Don't do updates while entering the pipe or being dead
    if (!this.alive) {
      return;
    }

    this.fireCoolDown -= delta;

    if (this.wasHurt > 0) {
      this.wasHurt -= delta;
      this.flashToggle = !this.flashToggle;
      this.alpha = this.flashToggle ? 0.2 : 1;
      if (this.wasHurt <= 0) {
        this.alpha = 1;
      }
    }

    let input = {
      left: keys.left.isDown,
      right: keys.right.isDown,
      down: keys.down.isDown,
      jump: keys.jump.isDown || keys.jump2.isDown,
      fire: keys.fire.isDown
    };

    if (input.fire && this.fireCoolDown < 0 && this.bullets >= 1) {
      this.bullets--;
      const projectileOwner = socket.id;
      const projectileOwnerName = this.scene.homeFightUser;
      socket.emit('sendProjectile', {
        x: this.x,
        y: this.y - 2,
        left: this.flipX,
        projectileOwner,
        projectileOwnerName
      });
      this.fireCoolDown = 300;
    }

    // this.angle++
    //  console.log(this.body.velocity.y);
    if (this.body.velocity.y > 0) {
      this.falling = true;
    }

    this.jumpTimer -= delta;

    if (input.left) {
      if (this.body.velocity.y === 0) {
        this.run(-this.acceleration);
      } else {
        this.run(-this.acceleration / 3);
      }
      this.flipX = true;
    } else if (input.right) {
      if (this.body.velocity.y === 0) {
        this.run(this.acceleration);
      } else {
        this.run(this.acceleration / 3);
      }
      this.flipX = false;
    } else if (this.body.blocked.down) {
      if (Math.abs(this.body.velocity.x) < 20) {
        this.body.setVelocityX(0);
        this.run(0);
      } else {
        this.run(((this.body.velocity.x > 0 ? -1 : 1) * this.acceleration) / 2);
      }
    } else if (!this.body.blocked.down) {
      this.run(0);
    }

    if (input.jump && (!this.jumping || this.jumpTimer > 0)) {
      this.jump();
    } else if (!input.jump) {
      this.jumpTimer = -1; // Don't resume jump if button is released, prevents mini double-jumps
      if (this.body.blocked.down) {
        this.jumping = false;
      }
    }

    let anim = null;
    if (this.body.velocity.y !== 0) {
      anim = 'jump';
      anim = 'player-pv-idle';
    } else if (this.body.velocity.x !== 0) {
      anim = 'player-pv-run';
      if (
        (input.left || input.right) &&
        ((this.body.velocity.x > 0 && this.body.acceleration.x < 0) ||
          (this.body.velocity.x < 0 && this.body.acceleration.x > 0))
      ) {
        anim = 'turn';
        anim = 'player-pv-idle';
      } else if (
        this.animSuffix !== '' &&
        input.down &&
        !(input.right || input.left)
      ) {
        anim = 'bend';
        anim = 'player-pv-idle';
      }
    } else {
      anim = 'player-pv-idle';
      if (
        this.animSuffix !== '' &&
        input.down &&
        !(input.right || input.left)
      ) {
        anim = 'player-pv-idle';
      }
    }

    //anim += this.animSuffix;
    if (
      this.anims.currentAnim.key !== anim &&
      !this.scene.physics.world.isPaused
    ) {
      console.log('anim', anim);
      this.anims.play(anim);
    }

    this.physicsCheck = true;
    const { x, y, flipX } = this;
    console.log('position', x + '   ' + y);
    socket.emit('move', {
      anim: anim,
      velx: this.body.velocity.x,
      vely: this.body.velocity.y,
      accx: this.body.acceleration.x,
      accy: this.body.acceleration.y,
      x,
      y,
      r: flipX
    });
  }

  run(vel) {
    this.body.setAccelerationX(vel);
  }

  jump() {
    if (!this.body.blocked.down && !this.jumping) {
      return;
    }

    if (!this.jumping) {
      if (this.animSuffix === '') {
        this.scene.sound.playAudioSprite('sfx', 'smb_jump-small');
      } else {
        this.scene.sound.playAudioSprite('sfx', 'smb_jump-super');
      }
    }
    if (this.body.velocity.y < 0 || this.body.blocked.down) {
      this.body.setVelocityY(-1000);
    }
    if (!this.jumping) {
      this.jumpTimer = 300;
    }
    this.jumping = true;
  }

  enemyBounce(enemy) {
    // Force Mario y-position up a bit (on top of the enemy) to avoid getting killed
    // by neigbouring enemy before being able to bounce
    this.body.y = enemy.body.y - this.body.height;
    // TODO: if jump-key is down, add a boost value to jump-velocity to use and init jump for controls to handle.
    this.body.setVelocityY(-150);
  }

  resize(large) {
    this.scene.physics.world.pause();
    if (large) {
      this.large();
      this.animSuffix = 'Super';
      this.play('grow');
    } else {
      this.small();
      this.animSuffix = '';
      this.play('shrink');
    }
  }

  small() {
    this.body.setSize(105, 180);
    this.body.offset.set(25, 85);
  }

  large() {
    this.body.setSize(105, 180);
    this.body.offset.set(25, 85);
  }

  die() {
    this.bullets = 0;
    this.scene.music.pause();
    this.play('death');
    socket.emit('playerDeath', {
      player: this,
      id: socket.id
    });
    this.scene.sound.playAudioSprite('sfx', 'smb_mariodie');
    this.body.setAcceleration(0);
    this.body.setVelocity(0, -600);
    this.alive = false;
    // this.scene.enemyPlayerGroup.remove(this);
    this.scene.playerName.destroy();
    this.respawn();
    this.destroy();
  }

  respawn() {
    for (var i = 0; i < this.respawnCount; i++) {
      var count = this.respawnCount - i;
      setTimeout(
        this.respawnText,
        (i + 1) * 1000,
        'Empezando de nuevo en ' + count + '...',
        i,
        this.scene
      );
    }
    setTimeout(this.scene.respawnPlayer, this.respawnCount * 1000, this);
  }

  getHurt(fireTouch) {
    if (this.isHurt) {
      return;
    } else {
      this.isHurt = true;
      let finalAcelX = 0;
      let finalAcelY = 0;
      if (fireTouch.right) finalAcelX = 600;
      if (fireTouch.left) finalAcelX = -600;

      this.body.setVelocityX(finalAcelX);
      var tween = this.scene.tweens.add(
        { targets: this, alpha: 0, duration: 200, yoyo: true, loop: -1 },
        1900,
        'Linear',
        true
      );
      setTimeout(this.finishHurting, 2000, this, tween);
    }
  }

  finishHurting(player, tween) {
    console.log('invencibility has finished');
    player.isHurt = false;
    tween.stop();
    player.alpha = 1;
  }

  respawnText(textString, index, scene) {
    console.log(textString, index);
    var style = {
      font: '48px Verdana',
      fill: 'red',
      align: 'right',
      backgroundColor: '#ffcc99'
    };

    var text = scene.add
      .text(500, 20 * index, textString, style)
      .setScrollFactor(0, 0);

    text.alpha = 1;
    scene.tweens.add(
      { targets: text, alpha: 0, duration: 1000 },
      3000,
      'Linear',
      true
    );
  }

  collideWithMap(sprite, tile) {
    // Just run callbacks when hitting something from below or trying to enter it
    this.scene.tileCollision(sprite, tile);
  }
}
