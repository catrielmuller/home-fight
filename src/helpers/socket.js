import io from 'socket.io-client';

console.log('Sólo me cargo 1 vez!');

const socket = io('https://home-fight-server.herokuapp.com');
socket.on('connect', () => {
  console.log('Ud. se ha conectado!');
});

export default socket;
