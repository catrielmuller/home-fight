import socket from '../helpers/socket';

export default class EnemyPlayer extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, config.x, config.y - 16, config.key);
    config.scene.physics.world.enable(this);
    config.scene.add.existing(this);
    this.alive = true;
    this.anims.play('standSuper');

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
    this.body.setSize(12, 16);
    this.body.offset.set(10, 12);
  }

  move({ x, y, r }) {
    this.body.reset(x, y);
    this.flipX = r;
  }
}
