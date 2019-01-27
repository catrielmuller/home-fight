class CreditScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'CreditScene'
    });
  }
  preload() {
    this.credits = this.add.tileSprite(640, 360, 1280, 720, 'credits');

    this.selectText = this.add.bitmapText(
      10,
      600,
      'font',
      'PRESS ENTER TO RESTART',
      20
    );

    this.keyEvent = this.keyEvent.bind(this);
    window.addEventListener('keydown', this.keyEvent);
  }

  update(){
    this.selectText.x = Math.floor(640 - (this.selectText.width / 2));
  }

  keyEvent(event){
    if(event.key === 'Enter'){
      location.reload(true);
      window.removeEventListener('keydown', this.keyEvent);
      return;
    }
  }
}

export default CreditScene;
