import io from 'socket.io-client';

console.log('Sólo me cargo 1 vez!');

const socket = io('https://home-fight-server.herokuapp.com'); //
// const socket = io('http://10.1.3.75:3005');
socket.on('connect', () => {
  console.log('Ud. se ha conectado!');
});

export default socket;
