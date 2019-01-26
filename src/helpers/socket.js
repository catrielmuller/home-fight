import io from 'socket.io-client';

console.log('Sólo me cargo 1 vez!');

const socket = io('http://10.1.3.75:3005');
socket.on('connect', () => {
  console.log('Ud. se ha conectado!');
});

export default socket;
