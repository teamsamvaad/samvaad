import { io } from 'socket.io-client';

const SERVER_URL = 'https://samvaad-3f6x.onrender.com';

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export default socket;
