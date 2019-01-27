import 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import SelectScene from './scenes/SelectScene';
import CreditScene from './scenes/CreditScene';

const config = {
  type: Phaser.WEBGL,
  pixelArt: true,
  roundPixels: true,
  parent: 'content',
  width: 1280,
  height: 720,
  zoom: 2,
  autoResize: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 800
      },
      debug: false
    }
  },
  plugins: {
  },
  scene: [BootScene, SelectScene, GameScene, CreditScene]
};

const game = new Phaser.Game(config); // eslint-disable-line no-unused-vars