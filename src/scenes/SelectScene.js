class SelectScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'SelectScene'
    });
  }
  preload() {
    this.selectText = this.add.bitmapText(
      10,
      600,
      'font',
      'ENTER USERNAME',
      20
    );

    const homeFightUser = localStorage.getItem('home-fight-user');
    if(homeFightUser) {
      this.text = homeFightUser;
    } else {
      this.text = '!';
    }

    this.inputText = this.add.text(10, 650, this.text, {
      backgroundColor: '#fff',
      color: '#000',
      active: true,
      boundsAlignH: 'center'
    });

    this.keyEvent = this.keyEvent.bind(this);
    window.addEventListener('keydown', this.keyEvent);

    this.time.addEvent({ delay: 500, callback: this.onTick, callbackScope: this, loop: true});
  }

  keyEvent(event){
    if(this.text === '!'){
      this.text = '';
    }
    if(event.key === 'Enter'){
      if(this.text.length <= 0){
        this.text = Math.floor(Math.random() * 99999) + 1;
      }
      localStorage.setItem('home-fight-user', this.text);
      this.scene.start('GameScene');
      window.removeEventListener('keydown', this.keyEvent);
      return;
    }
    if(event.key === 'Backspace'){
      if(this.text.length >= 1){
        this.text = this.text.slice(0, -1);
      }
    }
    var inp = String.fromCharCode(event.keyCode);
    if (/[a-zA-Z0-9-_ ]/.test(inp)){
      this.text += inp;
    }
    this.inputText.setText(this.text + '!');
  }

  onTick(){
    this.inputText.setVisible(!this.inputText.visible);
  }

  update(){
    this.inputText.x = Math.floor(640 - (this.inputText.width / 2));
    this.selectText.x = Math.floor(640 - (this.selectText.width / 2));
  }
}

export default SelectScene;
