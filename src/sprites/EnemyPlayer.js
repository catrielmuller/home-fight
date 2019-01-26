import socket from '../helpers/socket';

export default class EnemyPlayer extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, config.x, config.y - 16, config.key);
    //config.scene.physics.world.enable(this);
    config.scene.add.existing(this);
    this.alive = true;
    this.anims.play('stand');

    // start still and wait until needed
    // this.body
    //   .setVelocity(0, 0)
    //   .setBounce(0, 0)
    //   .setCollideWorldBounds(false);
    // this.body.allowGravity = false;

    // Standard sprite is 16x16 pixels with a smaller body
    // this.body.setSize(12, 12);
    // this.body.offset.set(10, 12);
  }

  move({ x, y, r }) {
    this.x = x;
    this.y = y;
    this.flipX = r;
  }
}
