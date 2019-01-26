import io from 'socket.io-client';

console.log('Sólo me cargo 1 vez!');

const socket = io(SERVER_URL);
socket.on('connect', () => {
  console.log('Ud. se ha conectado!');
});

export default socket;
