import socket from '../helpers/socket';

export default class Fire extends Phaser.GameObjects.Sprite {
  clean() {
    console.log('init!');
    this.setVisible(true);
    this.setActive(true);
    this.bounce = 0;
    this.pickable = false;
    this.exploding = false;
    this.body.allowGravity = true;
    this.body.velocity.y = 0;
    this.body.velocity.x = 0;
  }

  constructor(scene) {
    super(scene);
    // super(config.scene, config.x, config.y, config.key);

    /* switch(config.type) {
            case "shot":
            case "obstacle":

        } */
    this.scene.physics.world.enable(this);
    this.owner;
    this.ownerName;
    this.body.setSize(8, 8);
    this.body.offset.set(4, 0);
    // break;

    this.on(
      'animationcomplete',
      () => {
        if (this.anims.currentAnim.key === 'fireExplode') {
          this.setActive(false);
          this.setVisible(false);
        }
      },
      this
    );
  }

  draw(projectileRecieved) {
    this.clean();
    // this.scene.add.existing(this);
    this.body.allowGravity = true;
    this.owner = projectileRecieved.projectileOwner;
    this.ownerName = projectileRecieved.projectileOwnerName;
    this.setPosition(projectileRecieved.x, projectileRecieved.y);
    this.body.velocity.x = 400 * (projectileRecieved.left ? -1 : 1);
    this.play('fireFly');
    this.scene.sound.playAudioSprite('sfx', 'smb_fireball');
  }

  spawn(projectileRecieved) {
    this.clean();
    // this.scene.add.existing(this);
    this.body.allowGravity = true;
    this.setPosition(projectileRecieved.x, projectileRecieved.y);
    this.body.velocity.x = 0;
    this.body.velocity.y = 10;
    this.pickable = true;
  }

  update(time, delta) {
    if (!this.active) {
      return;
    }
    this.scene.physics.world.collide(this, this.scene.groundLayer, () =>
      this.collided()
    );
    if (!this.exploding) {
      this.scene.physics.world.overlap(
        this,
        this.scene.player,
        (fire, player) => {
          if (socket.id === fire.owner) {
            if (this.bounce >= 1) {
              this.pickup(socket.id);
            }
            return;
          } else if (this.pickable) {
            this.pickup(socket.id);
            return;
          }

          console.log('colision! ', fire, player);
          socket.emit('hit', {
            source: fire.owner,
            sourceName: fire.ownerName,
            target: socket.id,
            targetName: player.scene.homeFightUser
          });
          this.explode();
        }
      );
    }
  }

  pickup(player, broadcast = true) {
    console.log('Picked up by', player);
    this.setActive(false);
    this.setVisible(false);
    if (broadcast) {
      socket.emit('fireballPickedUp', {
        id: this.id,
        player,
        x: this.body.x,
        y: this.body.y
      });
    }
    delete this.scene.fireballs[this.id];
  }

  collided() {
    if (this.pickable) {
      return;
    }
    if (this.body.velocity.y === 0) {
      if (this.bounce < 3) {
        this.bounce += 1;
        this.body.velocity.y = -150 / this.bounce;
        this.body.velocity.x /= 2;
      } else {
        this.pickable = true;
        this.body.setAcceleration(0, 0);
        this.body.setVelocity(0, 0);
      }
    }
  }

  explode(broadcast = true) {
    this.exploding = true;
    this.scene.sound.playAudioSprite('sfx', 'smb_bump');
    this.body.allowGravity = false;
    this.body.velocity.y = 0;
    this.body.velocity.x = 0;
    this.play('fireExplode');
    if (broadcast) {
      socket.emit('fireballExploded', {
        id: this.id,
        x: this.body.x,
        y: this.body.y
      });
    }
    delete this.scene.fireballs[this.id];
  }
}
