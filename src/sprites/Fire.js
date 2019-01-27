import socket from '../helpers/socket';

export default class Fire extends Phaser.GameObjects.Sprite {
  constructor(scene) {
    super(scene);
    this.exploding = false;
    // super(config.scene, config.x, config.y, config.key);

    /* switch(config.type) {
            case "shot":
            case "obstacle":

        } */
    this.scene.physics.world.enable(this);
    this.owner;
    this.body.setSize(8, 8);
    this.body.offset.set(4, 0);
    // break;

    this.on(
      'animationcomplete',
      () => {
        if (this.anims.currentAnim.key === 'fireExplode') {
          this.setActive(false);
          this.setVisible(false);
          this.exploding = false;
        }
      },
      this
    );
  }

  draw(projectileRecieved) {
    this.setActive(true);
    this.setVisible(true);
    // this.scene.add.existing(this);
    this.body.allowGravity = true;
    this.owner = projectileRecieved.projectileOwner;
    this.setPosition(projectileRecieved.x, projectileRecieved.y);
    this.body.velocity.x = 400 * (projectileRecieved.left ? -1 : 1);
    this.play('fireFly');
    this.scene.sound.playAudioSprite('sfx', 'smb_fireball');
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
        this.scene.mario,
        (fire, mario) => {
          if (socket.id === fire.owner) {
            return;
          }
          console.log('colision! ', fire, mario);
          socket.emit('hit', {
            source: fire.owner,
            target: socket.id
          });
          this.explode();
          mario.getHit();
        }
      );
      this.scene.physics.world.overlap(
        this,
        this.scene.enemyPlayerGroup,
        (fire, enemy) => {
          if (fire.owner !== enemy.id) {
            console.log('colision! ', fire, enemy);
            this.explode();
          }
        }
      );
    }
  }

  collided() {
    if (this.body.velocity.y === 0) {
      this.body.velocity.y = -150;
    }
    if (this.body.velocity.x === 0) {
      this.explode();
    }
  }

  explode() {
    this.exploding = true;
    this.scene.sound.playAudioSprite('sfx', 'smb_bump');
    this.body.allowGravity = false;
    this.body.velocity.y = 0;
    this.body.velocity.x = 0;
    this.play('fireExplode');
  }
}
