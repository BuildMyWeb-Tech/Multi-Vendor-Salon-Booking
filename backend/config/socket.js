// backend/config/socket.js
// Singleton Socket.IO instance — import { getIO, emitToShop, emitToUser } anywhere
import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // Client sends { type: 'admin'|'user', id: shopId|userId }
    socket.on('join', ({ type, id }) => {
      if (!type || !id) return;
      const room = `${type}:${id}`;
      socket.join(room);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
};

// Emit a notification event to all admins of a shop
export const emitToShop = (shopId, notification) => {
  try {
    getIO().to(`admin:${shopId}`).emit('admin_notification', notification);
  } catch {}
};

// Emit a notification event to a specific user
export const emitToUser = (userId, notification) => {
  try {
    getIO().to(`user:${userId}`).emit('user_notification', notification);
  } catch {}
};
