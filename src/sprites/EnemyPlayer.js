import socket from '../helpers/socket';

export default class EnemyPlayer extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, config.x, config.y - 16, config.key);
    this.id = config.id;
    this.bullets = config.bullets;
    config.scene.physics.world.enable(this);
    config.scene.add.existing(this);
    this.alive = true;
    this.anim = 'standSuper';
    this.isHurt = false;

    // config.scene.physics.world.enable(this);
    config.scene.add.existing(this);

    config.scene.physics.add.collider(config.scene.groundLayer, this);

    this.acceleration = 0;
    this.body.maxVelocity.x = 0;
    this.body.maxVelocity.y = 0;

    // start still and wait until needed
    // this.body
    //   .setVelocity(0, 0)
    //   .setBounce(0, 0)
    //   .setCollideWorldBounds(false);
    this.body.setAllowGravity(false);

    // Standard sprite is 16x16 pixels with a smaller body
    this.body.setSize(12, 12);
    this.body.offset.set(10, 12);
  }

  move({ anim, x, y, r, velx, vely, accx, accy }) {
    this.body
      .setVelocity(velx, vely)
      .setAcceleration(accx, accy)
      .reset(x, y);
    this.anim = anim;
    this.flipX = r;
  }

  update(time, delta) {
    const anim = this.anim;
    if (
      anim &&
      (!this.anims.currentAnim || this.anims.currentAnim.key != anim)
    ) {
      this.anims.play(anim);
    }
  }

  die() {
    this.alive = false;
    this.scene.enemyPlayerGroup.remove(this);
    this.destroy();
  }

  getHurt() {
    if(this.isHurt){ 
      return
    } else {
      this.isHurt = true;
      var tween = this.scene.tweens.add({ targets: this, alpha: 0, duration: 200, yoyo: true, loop:-1  },
          1900,
          'Linear',
          true
        );
      setTimeout(this.finishHurting,2000, this, tween)
    }    
  }

  finishHurting(player, tween){
    console.log("invencibility has finished")
    player.isHurt = false;
    tween.stop();
    player.alpha = 1;   
  }
}
