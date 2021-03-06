import Enemy from './Enemy';

export default class Goomba extends Enemy {
  constructor(config) {
    super(config);
    this.body
      .setVelocity(0, 0)
      .setBounce(0, 0)
      .setCollideWorldBounds(false);
    this.anims.play('goomba');
    this.killAt = 0;
  }

  update(time, delta) {
    // If it's not activated, then just skip the update method (see Enemy.js)
    if (!this.activated()) {
      return;
    }
    this.scene.physics.world.collide(this, this.scene.groundLayer);
    if (this.killAt !== 0) {
      // The killtimer is set, keep the flat Goomba then kill it for good.
      this.body.setVelocityX(0);
      this.killAt -= delta;
      if (this.killAt < 0) {
        this.kill();
      }
      return;
    }

    // Collide with Mario!
    this.scene.physics.world.overlap(this, this.scene.player, this.playerHit);

    // The Goomba stopped, better try to walk in the other direction.
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.velocity.x = this.direction;
    }
  }

  playerHit(enemy, player) {
    if (enemy.verticalHit(enemy, player)) {
      // Mario jumps on the enemy
      player.enemyBounce(enemy);
      enemy.scene.sound.playAudioSprite('sfx', 'smb_stomp');
      enemy.getFlat(enemy, player);
      // get points
      enemy.scene.updateScore(100);
    } else {
      // Mario collides with the enemy
      enemy.hurtPlayer(enemy, player);
    }
  }

  getFlat(enemy) {
    enemy.play('goombaFlat');
    enemy.body.setVelocityX(0);
    enemy.body.acceleration.x = 0;
    // Keep goomba flat for 500ms, then remove it.
    enemy.killAt = 500;
  }
}
