import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitEvent(event: string, payload: any, senderSocketId?: string) {
  if (!io) return;
  if (senderSocketId && typeof senderSocketId === 'string' && senderSocketId.trim()) {
    io.except(senderSocketId.trim()).emit(event, payload);
  } else {
    io.emit(event, payload);
  }
}
