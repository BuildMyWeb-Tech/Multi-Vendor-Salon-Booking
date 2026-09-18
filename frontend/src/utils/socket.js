// frontend/src/utils/socket.js
// Singleton socket connection shared across the app
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
};

export const joinAdminRoom = (shopId) => {
  if (!shopId) return;
  getSocket().emit('join', { type: 'admin', id: shopId });
};

export const joinUserRoom = (userId) => {
  if (!userId) return;
  getSocket().emit('join', { type: 'user', id: userId });
};

export const leaveRoom = (type, id) => {
  if (!id) return;
  // Socket.IO handles room leave on disconnect; re-joining another room is enough
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
