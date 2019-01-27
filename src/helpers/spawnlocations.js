const Spawnlocations = {
  locations: [{ x: 1050, y: 750 }], //, {x:50, y:500},{x:200, y:1000},{x:250, y:550},{x:100, y:300},{x:600, y:1000}],

  getRandomSpawnLocation() {
    return this.locations[this.getRndInteger(0, this.locations.length)];
  },

  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
};
export default Spawnlocations;
